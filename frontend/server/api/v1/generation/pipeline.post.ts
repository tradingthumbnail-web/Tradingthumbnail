import { randomUUID } from "crypto";

import { db } from "~~/server/database";
import { pipelineTable, type PipelineRunParameters, type PipelineElement, type PipelineConfig } from "~~/server/database/schemas/pipeline.schema";
import { avatarTable } from "~~/server/database/schemas/avatar.schema";
import { eq, and, isNull } from "drizzle-orm";

import { generateQuickThumbImageWithOpenAI, type CharacterImage } from "~~/server/services/openai/generate-quick-thumb";
import { generateImageDescriptionForInpainting } from "~~/server/services/image/generate-image-description";
import { saveImageToDB } from "~~/server/services/image.service";
import { saveActivity } from "~~/server/services/activity/save-activity";

import { storage } from "~~/server/storage";
import { generateImageStorageKey, generateAvatarWeightsKey, generateAvatarTrainingImageKey } from "~~/server/storage/keys";

import { generateMaskFromRectanglePosition } from "~~/server/utils/clip-mask";
import { generateInpaintingFaceChange } from "~~/server/services/fal/inpainting-face-change";
import sharp from "sharp";
import { runChargedWork } from "~~/server/services/user/credits";
import { FIXED_GENERATION_COSTS } from "~~/server/services/generation/generation-cost";
import { getOwnedAvatarOrThrow } from "~~/server/services/avatar/owned-avatar";

const CANVAS_WIDTH = 1270;
const CANVAS_HEIGHT = 720;

interface RunPipelinePayload {
    pipelineId: string;
    parameters: PipelineRunParameters;
    canvasDataUrl: string;
    useSimilarStyle?: boolean;
    additionalInstructions?: string;
}

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const { pipelineId, parameters, canvasDataUrl, useSimilarStyle, additionalInstructions } = await readBody<RunPipelinePayload>(event);
    if (!pipelineId || !parameters || !canvasDataUrl) {
        throw createError({ statusCode: 400, statusMessage: 'pipelineId, parameters and canvasDataUrl are required' });
    }

    try {
        return await runChargedWork(user.id, FIXED_GENERATION_COSTS.pipeline, async () => {
        const startTime = performance.now();
        console.log('--- Starting pipeline execution...');

        const pipeline = await db.query.pipelineTable.findFirst({
            where: and(
                eq(pipelineTable.id, pipelineId),
                eq(pipelineTable.userId, user.id),
                isNull(pipelineTable.deletedAt),
            ),
        });

        if (!pipeline) {
            throw createError({ statusCode: 404, statusMessage: 'Pipeline not found' });
        }

        const elements = pipeline.canvasData.elements;

        const characterImages: CharacterImage[] = [];
        const avatarElementsForLora: { element: PipelineElement; avatarId: string }[] = [];

        for (const elem of elements) {
            if (elem.type !== 'AVATAR') continue;

            const param = parameters[elem.id];
            const characterType = elem.avatarOptions?.characterType || 'avatar';

            if (characterType === 'uploadable') {
                if (param?.characterImageBase64) {
                    characterImages.push({
                        base64: param.characterImageBase64,
                        label: elem.label,
                        instructions: elem.additionalInstructions,
                    });
                    console.log(` |- Added uploadable character image for "${elem.label}"`);
                }
            } else {
                const avatarId = param?.avatarId || elem.avatarOptions?.defaultAvatarId;
                if (avatarId) {
                    await getOwnedAvatarOrThrow(avatarId, user.id);
                    console.log(` |- Fetching avatar training image for "${elem.label}"...`);
                    const avatarImageStorageKey = generateAvatarTrainingImageKey(user.id, avatarId, '1');
                    const avatarImageBuffer = await storage.get(avatarImageStorageKey);
                    if (avatarImageBuffer) {
                        characterImages.push({
                            base64: avatarImageBuffer.toString('base64'),
                            label: elem.label,
                            instructions: elem.additionalInstructions,
                        });
                        avatarElementsForLora.push({ element: elem, avatarId });
                        console.log(` |- Avatar image fetched successfully for "${elem.label}"`);
                    }
                }
            }
        }

        let referenceImageBase64 = '';
        if (useSimilarStyle && pipeline.config?.referenceImageStorageKey) {
            console.log(' |- Fetching reference image for consistency (useSimilarStyle=true)...');
            const referenceImageBuffer = await storage.get(pipeline.config.referenceImageStorageKey);
            if (referenceImageBuffer) {
                referenceImageBase64 = referenceImageBuffer.toString('base64');
                console.log(' |- Reference image fetched successfully');
            }
        }

        let promptDescription = `Generate a professional YouTube thumbnail based on the provided canvas layout.\n`;
        promptDescription += `Pipeline: ${pipeline.name}\n`;
        if (pipeline.description) {
            promptDescription += `Description: ${pipeline.description}\n`;
        }

        if (referenceImageBase64) {
            promptDescription += `\nIMPORTANT: A reference image is provided. Replicate its overall style, composition, lighting, and aesthetic as closely as possible. Only change the specific configurable elements (text, assets, avatars) as specified below.\n`;
        }

        const textElements = elements.filter(e => e.type === 'TEXT');
        if (textElements.length > 0) {
            promptDescription += `\nText elements in the thumbnail:\n`;
            for (const elem of textElements) {
                const param = parameters[elem.id];
                const text = elem.isConfigurable 
                    ? (param?.text || elem.textOptions?.defaultText || elem.textOptions?.placeholder || '')
                    : (elem.textOptions?.fixedText || '');
                if (text) {
                    promptDescription += `- ${elem.label}: "${text}"`;
                    if (elem.additionalInstructions) {
                        promptDescription += ` (${elem.additionalInstructions})`;
                    }
                    promptDescription += `\n`;
                }
            }
        }

        const assetElements = elements.filter(e => e.type === 'ASSET');
        if (assetElements.length > 0) {
            promptDescription += `\nAsset elements in the thumbnail:\n`;
            for (const elem of assetElements) {
                promptDescription += `- ${elem.label}`;
                if (elem.additionalInstructions) {
                    promptDescription += `: ${elem.additionalInstructions}`;
                }
                promptDescription += `\n`;
            }
        }

        if (characterImages.length > 0) {
            promptDescription += `\nCharacter elements in the thumbnail:\n`;
            for (const char of characterImages) {
                promptDescription += `- ${char.label}`;
                if (char.instructions) {
                    promptDescription += `: ${char.instructions}`;
                }
                promptDescription += `\n`;
            }
        }

        if (pipeline.config?.thumbnailStyle) {
            promptDescription += `\nStyle: ${pipeline.config.thumbnailStyle}\n`;
        }

        if (additionalInstructions) {
            promptDescription += `\nAdditional instructions for this generation:\n${additionalInstructions}\n`;
        }

        console.log(' |- Prompt prepared:', promptDescription);

        const image = await generateQuickThumbImageWithOpenAI({
            canvasDataURL: canvasDataUrl,
            thumbDescriptionPrompt: promptDescription,
            referenceImage: referenceImageBase64,
            characterImages: characterImages.length > 0 ? characterImages : undefined,
        });

        if (!image) {
            console.error('-x- Failed to generate pipeline image');
            throw createError({ statusCode: 500, statusMessage: 'Failed to generate image' });
        }

        const imageId = randomUUID();
        const imageStorageKey = generateImageStorageKey(user.id, 'THUMBNAIL', imageId);
        await storage.put(imageStorageKey, image, 'image/png');
        let imagePresignedUrl = await storage.generatePresignedUrl(imageStorageKey);

        const isFirstRun = !pipeline.config?.referenceImageStorageKey;
        if (isFirstRun) {
            console.log(' |- First run detected, saving reference image for future consistency...');
            const referenceStorageKey = `${user.id}/pipeline/${pipeline.id}/reference.png`;
            await storage.put(referenceStorageKey, image, 'image/png');
            
            const updatedConfig: PipelineConfig = {
                ...pipeline.config,
                referenceImageStorageKey: referenceStorageKey,
            };
            await db.update(pipelineTable)
                .set({ config: updatedConfig })
                .where(eq(pipelineTable.id, pipelineId));
            console.log(' |- Reference image saved');
        }

        for (const { element: avatarElement, avatarId } of avatarElementsForLora) {
            console.log(` |- Applying avatar LoRA for "${avatarElement.label}"...`);

            const avatar = await db.query.avatarTable.findFirst({
                where: and(
                    eq(avatarTable.id, avatarId),
                    eq(avatarTable.userId, user.id),
                    isNull(avatarTable.deletedAt),
                ),
            });

            if (avatar) {
                const weightsStorageKey = generateAvatarWeightsKey(user.id, avatarId);
                const loraPresignedUrl = await storage.generatePresignedUrl(weightsStorageKey);

                const baseImageMeta = await sharp(image).metadata();
                const baseImageWidth = baseImageMeta.width ?? CANVAS_WIDTH;
                const baseImageHeight = baseImageMeta.height ?? CANVAS_HEIGHT;
                const avatarScaleX = baseImageWidth / CANVAS_WIDTH;
                const avatarScaleY = baseImageHeight / CANVAS_HEIGHT;

                const avatarRectScaled = {
                    width: Math.round(avatarElement.position.width * avatarScaleX),
                    height: Math.round(avatarElement.position.height * avatarScaleY),
                    left: Math.round(avatarElement.position.x * avatarScaleX),
                    top: Math.round(avatarElement.position.y * avatarScaleY),
                };

                // Expand mask by 100% (double width/height) around its center, clamped to canvas bounds
                const centerX = avatarRectScaled.left + avatarRectScaled.width / 2;
                const centerY = avatarRectScaled.top + avatarRectScaled.height / 2;
                const expandedWidth = avatarRectScaled.width * 2;
                const expandedHeight = avatarRectScaled.height * 2;

                const expandedLeft = Math.max(0, Math.round(centerX - expandedWidth / 2));
                const expandedTop = Math.max(0, Math.round(centerY - expandedHeight / 2));
                const expandedRight = Math.min(baseImageWidth, Math.round(centerX + expandedWidth / 2));
                const expandedBottom = Math.min(baseImageHeight, Math.round(centerY + expandedHeight / 2));

                const finalWidth = Math.max(1, expandedRight - expandedLeft);
                const finalHeight = Math.max(1, expandedBottom - expandedTop);

                const avatarMask = await generateMaskFromRectanglePosition({
                    position: {
                        x: expandedLeft,
                        y: expandedTop,
                    },
                    rectangleDimensions: { width: finalWidth, height: finalHeight },
                    canvasDimensions: { width: baseImageWidth, height: baseImageHeight },
                    background: 'black',
                });

                const maskStorageKey = `${user.id}/pipeline-avatar-mask-${avatarElement.id}.png`;
                await storage.put(maskStorageKey, avatarMask, 'image/png');
                const avatarMaskPresignedUrl = await storage.generatePresignedUrl(maskStorageKey);

                const imageDescription = await generateImageDescriptionForInpainting(imagePresignedUrl, promptDescription);
                if (imageDescription) {
                    const generatedAvatarImage = await generateInpaintingFaceChange({
                        model: "fal-ai/flux-lora/inpainting",
                        prompt: imageDescription,
                        imageUrl: imagePresignedUrl,
                        maskUrl: avatarMaskPresignedUrl,
                        weightsUrl: loraPresignedUrl,
                        weightsScale: 1,
                    });

                    await storage.put(imageStorageKey, generatedAvatarImage, 'image/png');
                    imagePresignedUrl = await storage.generatePresignedUrl(imageStorageKey);
                    console.log(` |- Avatar LoRA applied successfully for "${avatarElement.label}"`);

                    await storage.delete(maskStorageKey).catch(() => {});
                }
            }
        }

        const savedImage = await saveImageToDB({
            userId: user.id,
            imageId,
            storageKey: imageStorageKey,
            type: 'THUMBNAIL',
            state: 'GENERATED',
            isPublic: false,
            imageMetadata: {
                url: imageStorageKey,
                pipelineId: pipeline.id,
            },
            generationMetadata: {
                prompt: promptDescription,
                pipelineName: pipeline.name,
            },
        });

        await db.update(pipelineTable)
            .set({ 
                executionCount: pipeline.executionCount + 1,
                updatedAt: new Date(),
            })
            .where(eq(pipelineTable.id, pipelineId));

        await saveActivity({
            userId: user.id,
            targetType: 'IMAGE',
            targetId: savedImage.id,
            eventType: 'pipeline.generated',
            payload: { pipelineId: pipeline.id, pipelineName: pipeline.name },
        });

        const endTime = performance.now();
        console.log(` |- Pipeline execution completed in ${(endTime - startTime) / 1000} seconds`);

        return savedImage;
        });

    } catch (error: any) {
        if (error.statusCode) throw error;
        console.error("-x- Error running pipeline", error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});