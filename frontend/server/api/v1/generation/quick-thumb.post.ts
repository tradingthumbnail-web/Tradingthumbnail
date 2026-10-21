import { randomUUID } from "crypto";

import { generateQuickThumbImageWithOpenAI } from "~~/server/services/openai/generate-quick-thumb";
import { generateQuickThumbDescriptionPrompt } from "~~/server/services/prompt/quick-thumb-description-prompt";
import { generateImageDescriptionForInpainting } from "~~/server/services/image/generate-image-description";

import { saveImageToDB } from "~~/server/services/image.service";
import { saveActivity } from "~~/server/services/activity/save-activity";

import { storage } from "~~/server/storage";
import { generateImageStorageKey, generateAvatarTrainingImageKey, generateAvatarWeightsKey } from "~~/server/storage/keys";

import { generateMaskFromRectanglePosition } from "~~/server/utils/clip-mask";
import { generateInpaintingFaceChange } from "~~/server/services/fal/inpainting-face-change";
import sharp from "sharp";
import { runChargedWork } from "~~/server/services/user/credits";
import { computeQuickThumbCost } from "~~/server/services/generation/generation-cost";
import { getOwnedAvatarOrThrow } from "~~/server/services/avatar/owned-avatar";

type PositionAnchor =
    | 'top-left' | 'top-center' | 'top-right'
    | 'center-left' | 'center' | 'center-right'
    | 'bottom-left' | 'bottom-center' | 'bottom-right';

type Rect = {
    width: number;
    height: number;
    top: number;
    left: number;
};

export type QuickThumbFormPayload = {
    title: string;
    sceneDescription: string;
    emotions: string;
    typeOfVideo: string;
    thumbnailStyle: string;
    includeText: boolean;
    textHeadline: string;
    layout: string;
    includeAvatar: boolean;
    avatarId: string;
    avatarEmotion: string;
    avatarPosition: PositionAnchor;
    backgroundType: string;
    textPosition: PositionAnchor;
    canvasDataUrl: string;
};

export type QuickThumbPositions = {
    avatar: { anchor: PositionAnchor; rect: Rect };
    text: { anchor: PositionAnchor; rect: Rect };
};

const CANVAS_WIDTH = 1270;
const CANVAS_HEIGHT = 720;
const CANVAS_MARGIN = 40;

function resolveLeftTop(anchor: PositionAnchor, rectWidth: number, rectHeight: number): { left: number; top: number } {
    const xMap: Record<string, number> = {
        left: CANVAS_MARGIN,
        center: (CANVAS_WIDTH - rectWidth) / 2,
        right: CANVAS_WIDTH - rectWidth - CANVAS_MARGIN,
    };
    const yMap: Record<string, number> = {
        top: CANVAS_MARGIN,
        center: (CANVAS_HEIGHT - rectHeight) / 2,
        bottom: CANVAS_HEIGHT - rectHeight - CANVAS_MARGIN,
    };
    const [v, h] = anchor.split('-') as [string, string | undefined];
    const vert = v || 'center';
    const horiz = h || v || 'center';
    return { left: xMap[horiz] ?? xMap.center, top: yMap[vert] ?? yMap.center };
}

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    try {
        // 1. Get the body and prepare the canvas
        const payload = await readBody<QuickThumbFormPayload>(event);

        if (payload.includeAvatar && payload.avatarId?.trim()) {
            await getOwnedAvatarOrThrow(payload.avatarId, user.id);
        }

        return await runChargedWork(user.id, computeQuickThumbCost(Boolean(payload.includeAvatar)), async () => {

        // 1.1 Compute normalized rects from anchors (used later for masks)
        const avatarRectWidth = Math.min(480, CANVAS_WIDTH * 0.45);
        const avatarRectHeight = Math.round(avatarRectWidth * 1.2); // approximate aspect for placeholder/mask
        const avatarPos = resolveLeftTop(payload.avatarPosition, avatarRectWidth, avatarRectHeight);

        // Make headline block larger and proportional to canvas
        const textRectWidth = Math.min(Math.round(CANVAS_WIDTH * 0.92), CANVAS_WIDTH - CANVAS_MARGIN * 2);
        const textRectHeight = Math.round(CANVAS_HEIGHT * 0.22);
        const textPos = resolveLeftTop(payload.textPosition, textRectWidth, textRectHeight);
        
        const positions: QuickThumbPositions = {
            avatar: { anchor: payload.avatarPosition, rect: { width: avatarRectWidth, height: avatarRectHeight, top: avatarPos.top, left: avatarPos.left } },
            text: { anchor: payload.textPosition, rect: { width: textRectWidth, height: textRectHeight, top: textPos.top, left: textPos.left } },
        };
        
        // 1.2. Prepare the four prompts
        const startTime = performance.now();
        const thumbDescriptionPrompt = await generateQuickThumbDescriptionPrompt({
            // Core form
            title: payload.title,
            description: payload.sceneDescription,
            emotions: payload.emotions,
            typeOfVideo: payload.typeOfVideo,
            thumbnailStyle: payload.thumbnailStyle,
            includeText: payload.includeText,
            textHeadline: payload.textHeadline,
            layout: payload.layout,

            // Avatar related
            includeAvatar: payload.includeAvatar,
            avatarId: payload.avatarId,
            avatarEmotion: payload.avatarEmotion,

            // Additional
            backgroundType: payload.backgroundType,

            // Positions computed above
            positions,

            // Optional: pipeline can attach a canvas data URL later
            canvasDataUrl: payload.canvasDataUrl,
        });
        console.log(" |- Prompts prepared")

        // 1.3. Fetch an avatar image to use as the base for the image generation (only if avatar is included)
        let avatarImage: Buffer | null = null;
        if (payload.includeAvatar && payload.avatarId?.trim()) {
            const avatarImageStorageKey = generateAvatarTrainingImageKey(user.id, payload.avatarId, '1');
            avatarImage = await storage.get(avatarImageStorageKey);
            if (!avatarImage) {
                console.error('-x- Failed to fetch avatar image');
                throw createError({ statusCode: 500, statusMessage: 'Failed to fetch avatar image' });
            };
        }

        // 2. Generate the four different base images with OpenAI
        const image = await generateQuickThumbImageWithOpenAI({
            canvasDataURL: payload.canvasDataUrl,
            thumbDescriptionPrompt: thumbDescriptionPrompt,
            avatarImage: avatarImage ? avatarImage.toString('base64') : '',
        });
        if (!image) {
            console.error('-x- Failed to generate quick thumb image');
            throw createError({ statusCode: 500, statusMessage: 'Failed to generate quick thumb image' });
        };

        // 2.1. Save the image to the storage in a temporal folder
        const imageId = randomUUID();
        const imageStorageKey = generateImageStorageKey(user.id, 'THUMBNAIL', imageId);
        await storage.put(imageStorageKey, image, 'image/png');
        const imagePresignedUrl = await storage.generatePresignedUrl(imageStorageKey);

        // 3. Based on the position of the character, apply LORA model (only if avatar is included)
        if (payload.includeAvatar && payload.avatarId) {
            // 3.1. Get the presigned URL for the lora model
            const weightsStorageKey = generateAvatarWeightsKey(user.id, payload.avatarId);
            const loraPresignedUrl = await storage.generatePresignedUrl(weightsStorageKey);

            // 3.2. Generate a mask for the avatar position (scaled to generated image size)
            const baseImageMeta = await sharp(image).metadata();
            const baseImageWidth = baseImageMeta.width ?? CANVAS_WIDTH;
            const baseImageHeight = baseImageMeta.height ?? CANVAS_HEIGHT;
            const avatarScaleX = baseImageWidth / CANVAS_WIDTH;
            const avatarScaleY = baseImageHeight / CANVAS_HEIGHT;
            const avatarRectScaled = {
                width: Math.round(positions.avatar.rect.width * avatarScaleX),
                height: Math.round(positions.avatar.rect.height * avatarScaleY),
                left: Math.round(positions.avatar.rect.left * avatarScaleX),
                top: Math.round(positions.avatar.rect.top * avatarScaleY),
            };
            const avatarMask = await generateMaskFromRectanglePosition({
                position: {
                    x: avatarRectScaled.left,
                    y: avatarRectScaled.top,
                },
                rectangleDimensions: { width: avatarRectScaled.width, height: avatarRectScaled.height },
                canvasDimensions: { width: baseImageWidth, height: baseImageHeight },
                background: 'black',
            });
            const maskStorageKey = `${user.id}/avatar-mask.png`;
            await storage.put(maskStorageKey, avatarMask, 'image/png');
            const avatarMaskPresignedUrl = await storage.generatePresignedUrl(maskStorageKey);

            // 3.3. Apply the mask to the image using the lora model
            const imageDescription = await generateImageDescriptionForInpainting(imagePresignedUrl, thumbDescriptionPrompt);
            if (!imageDescription) {
                console.error('-x- Failed to generate image description');
                throw createError({ statusCode: 500, statusMessage: 'Failed to generate image description' });
            };
            const generetedAvatarImage = await generateInpaintingFaceChange({
                model: "fal-ai/flux-lora/inpainting",
                prompt: imageDescription,
                imageUrl: imagePresignedUrl,
                maskUrl: avatarMaskPresignedUrl,
                weightsUrl: loraPresignedUrl,
                weightsScale: 1,
            });

            // 3.4. Replace the image with the generated avatar image
            await storage.put(imageStorageKey, generetedAvatarImage, 'image/png');
        }

        // 4. Save the image to the database and to the storage
        const savedImage = await saveImageToDB({
            userId: user.id,
            imageId,
            storageKey: imageStorageKey,
            type: 'THUMBNAIL',
            state: 'GENERATED',
            isPublic: false,
            imageMetadata: {
                url: imageStorageKey,
            },
            generationMetadata: {
                prompt: thumbDescriptionPrompt,
            },
        });

        // 5. Save the activity
        await saveActivity({
            userId: user.id,
            targetType: 'IMAGE',
            targetId: savedImage.id,
            eventType: 'image.quick-thumb.generated',
            payload: {},
        });

        // 6. Return the images
        const endTime = performance.now();
        console.log(` |- Quick thumb generation completed successfully in ${(endTime - startTime) / 1000} seconds. Looking sharp 💜`);
        return [savedImage];
        });
        
    } catch (error) {
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error;
        }
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    };
});