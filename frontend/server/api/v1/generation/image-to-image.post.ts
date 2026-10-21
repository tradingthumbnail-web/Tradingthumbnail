import { and, eq } from "drizzle-orm";

import { db } from "~~/server/database";
import { avatarTable } from "~~/server/database/schemas/avatar.schema";

import { generateImageDescriptionForImageToImage } from "~~/server/services/image/img-to-image-base-description";
import { generateThumbPromptFromImageToImage } from "~~/server/services/image/generate-thumb-from-image-to-image-description";
import { generateImageToImage, FLUX_IMAGE_TO_IMAGE_PARAMS } from "~~/server/services/fal/generate-image-to-image";

import { storage } from "~~/server/storage";
import { generateAvatarStorageKey, generateAvatarWeightsKey, generateImageStorageKey } from "~~/server/storage/keys";
import { randomUUID } from "node:crypto";
import { saveImageToDB } from "~~/server/services/image.service";
import { saveActivity } from "~~/server/services/activity/save-activity";
import { runChargedWork } from "~~/server/services/user/credits";
import { FIXED_GENERATION_COSTS } from "~~/server/services/generation/generation-cost";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const { avatarId, keepBackground, matchLighting, referenceImageBase64, creativityLevel } = await readBody(event);
    if (!avatarId || !keepBackground || !matchLighting || !referenceImageBase64 || !creativityLevel) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request' });
    };

    try {
        return await runChargedWork(user.id, FIXED_GENERATION_COSTS.imageToImage, async () => {
        // 1. Check if the avatar exists and if it is owned by the user
        const avatar = await db.query.avatarTable.findFirst({
            where: and(
                eq(avatarTable.id, avatarId),
                eq(avatarTable.userId, user.id),
            ),
        });
        if (!avatar) {
            throw createError({ statusCode: 404, statusMessage: 'Avatar not found' });
        };

        // 2. Get a presigned URL for the lora weights
        console.log("--- Starting image to image generation...")
        const weightsStorageKey = generateAvatarWeightsKey(user.id, avatar.id);
        const weightsPresignedUrl = await storage.generatePresignedUrl(weightsStorageKey);

        // 2.1. Download the reference image and upload it to the storage
        const referenceImageBuffer = Buffer.from(referenceImageBase64, 'base64');
        const referenceImageStorageKey = `${user.id}/reference-image.png`;
        await storage.put(referenceImageStorageKey, referenceImageBuffer, 'image/png');
        const referenceImagePresignedUrl = await storage.generatePresignedUrl(referenceImageStorageKey);

        // 3. Get the image description for the image (use presigned URL, not base64)
        const imageDescription = await generateImageDescriptionForImageToImage(referenceImagePresignedUrl);
        if (!imageDescription) {
            throw createError({ statusCode: 500, statusMessage: 'Failed to generate image description' });
        }

        // 4. Get the thumb prompt from the image to image process
        const thumbPrompt = await generateThumbPromptFromImageToImage(referenceImagePresignedUrl, imageDescription);
        if (!thumbPrompt) {
            throw createError({ statusCode: 500, statusMessage: 'Failed to generate thumb prompt' });
        }

        // 5. Generate the image with the model
        const generatedImageURLs = await generateImageToImage({
            model: "fal-ai/flux-lora/image-to-image",
            prompt: thumbPrompt,
            numberOfImages: 1,
            referenceImageURL: referenceImagePresignedUrl,
            loraPresignedUrl: weightsPresignedUrl,
        });
        if (!generatedImageURLs) {
            throw createError({ statusCode: 500, statusMessage: 'Failed to generate image' });
        }

        // 6. Save the image to the database and the storage
        const newImageId = randomUUID();
        const newImageStorageKey = generateImageStorageKey(user.id, 'CHARACTER', newImageId);
        const generatedImageBuffer = await fetch(generatedImageURLs[0]).then(res => res.arrayBuffer());

        await storage.put(newImageStorageKey, Buffer.from(generatedImageBuffer), 'image/png');
        const newImagePresignedUrl = await storage.generatePresignedUrl(newImageStorageKey);

        // 6.1. Save it to the database
        const savedImage = await saveImageToDB({
            userId: user.id,
            imageId: newImageId,
            storageKey: newImageStorageKey,
            type: 'CHARACTER',
            state: 'GENERATED',
            isPublic: false,
            imageMetadata: {
                url: generatedImageURLs[0],
            },
            generationMetadata: {
                prompt: thumbPrompt,
                ...FLUX_IMAGE_TO_IMAGE_PARAMS,
            },
        });
        if (!savedImage) {
            throw createError({ statusCode: 500, statusMessage: 'Failed to save image' });
        };

        // 6.2. Save the activity
        await saveActivity({
            userId: user.id,
            targetType: "IMAGE",
            targetId: savedImage.id,
            eventType: "image.image-to-image.generated",
            payload: {
                ...FLUX_IMAGE_TO_IMAGE_PARAMS,
            },
        });

        // 6.3. Return the image
        console.log(" |- Image to image generation completed successfully 💜")
        // 7. Return the image
        return {
            generatedImage: savedImage,
            newImageUrl: newImagePresignedUrl,
        };
        });
    } catch (error) {
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error;
        }
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});