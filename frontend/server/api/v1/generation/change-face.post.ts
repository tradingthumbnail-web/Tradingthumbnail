import { randomUUID } from "crypto";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "~~/server/database";
import { avatarTable } from "~~/server/database/schemas/avatar.schema";
import { imageTable } from "~~/server/database/schemas/image.schema";

import { storage } from "~~/server/storage";
import { saveImageToDB } from "~~/server/services/image.service";

import { convertPathToMask } from "~~/server/utils/clip-mask";
import { generateImageDescriptionForInpainting } from "~~/server/services/image/generate-image-description";
import { generateAvatarWeightsKey, generateImageStorageKey } from "~~/server/storage/keys";
import { FLUX_INPAINTING_FACE_CHANGE_PARAMS, generateInpaintingFaceChange } from "~~/server/services/fal/inpainting-face-change";
import { runChargedWork } from "~~/server/services/user/credits";
import { FIXED_GENERATION_COSTS } from "~~/server/services/generation/generation-cost";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const { avatarId, prompt, pathMask, originalImageId } = await readBody(event);
    if (!avatarId || !prompt || !pathMask || !originalImageId) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request' });
    }

    try {
        return await runChargedWork(user.id, FIXED_GENERATION_COSTS.changeFace, async () => {
        // 1. Check if the avatar and the image exists and if it is owned by the user
        const avatar = await db.query.avatarTable.findFirst({
            where: and(
                eq(avatarTable.id, avatarId),
                eq(avatarTable.userId, user.id),
                isNull(avatarTable.deletedAt),
            ),
        });
        if (!avatar) {
            throw createError({ statusCode: 404, statusMessage: 'Avatar not found' });
        };

        const originalImage = await db.query.imageTable.findFirst({
            where: and(
                eq(imageTable.id, originalImageId),
                eq(imageTable.userId, user.id),
            ),
        });
        if (!originalImage) {
            throw createError({ statusCode: 404, statusMessage: 'Image not found' });
        };

        // 2. Download the image and convert it to buffer and process the path and canvas
        console.log("--- Inpainting face change generation...")
        const originalImageUrl = await storage.generatePresignedUrl(originalImage.storageKey);

        // 2.1. Convert the path to a buffer of the mask and upload it to the storage
        console.log(" |- Converting path to mask...")
        // Strip the data URL prefix (data:image/png;base64,) to get just the base64 string
        const base64Data = pathMask.replace(/^data:image\/\w+;base64,/, '');
        // Use fixed canvas dimensions used in the editor to avoid undefined width/height from dataURL
        const mask = await convertPathToMask(base64Data, 1270, 720);
        const maskStorageKey = `${user.id}/mask.png`;
        await storage.put(maskStorageKey, mask, 'image/png');
        const maskPresignedUrl = await storage.generatePresignedUrl(maskStorageKey);

        // 3. Get an image description for the inpainting process
        let imageDescription = prompt;
        imageDescription = await generateImageDescriptionForInpainting(originalImageUrl, prompt);

        // 4. Get the lora weights url
        const weightsStorageKey = generateAvatarWeightsKey(user.id, avatar.id);
        const weightsUrl = await storage.generatePresignedUrl(weightsStorageKey);

        // 5. Generate the inpainted image
        console.log(" |- Generating inpainted image...")
        const generatedImageBuffer = await generateInpaintingFaceChange({
            model: "fal-ai/flux-lora/inpainting",
            prompt: imageDescription,
            imageUrl: originalImageUrl,
            maskUrl: maskPresignedUrl,
            weightsUrl,
            weightsScale: 0.8,
        });

        // 6. Save the image to the database and the storage
        const newImageId = randomUUID();
        const newImageStorageKey = generateImageStorageKey(user.id, 'CHARACTER', newImageId);
        await storage.put(newImageStorageKey, generatedImageBuffer, 'image/png');

        const savedImage = await saveImageToDB({
            userId: user.id,
            imageId: newImageId,
            storageKey: newImageStorageKey,
            parentId: originalImage.id,
            rootId: originalImage.rootId ? originalImage.rootId : originalImage.id,
            projectId: originalImage.projectId ? originalImage.projectId : undefined,
            branchId: originalImage.branchId ? originalImage.branchId : undefined,
            toolId: originalImage.toolId ? originalImage.toolId : undefined,
            type: 'CHARACTER',
            state: 'GENERATED',
            isPublic: false,
            imageMetadata: {
                url: newImageStorageKey,
            },
            generationMetadata: {
                prompt: imageDescription,
                ...FLUX_INPAINTING_FACE_CHANGE_PARAMS,
            },
        });

        // 7. Return the image
        console.log(" |- Inpainting face change generation completed successfully 💜")
        return savedImage;
        });
    } catch (error) {
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error;
        }
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
    }
});