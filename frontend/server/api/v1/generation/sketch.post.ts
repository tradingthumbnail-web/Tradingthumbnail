import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { db } from "~~/server/database";
import { imageTable } from "~~/server/database/schemas/image.schema";
import { stylesTable } from "~~/server/database/schemas/style.schema";

import { generateSketch, SKETCH_PROMPT } from "~~/server/services/openai/generate-sketch";
import { storage } from "~~/server/storage";
import { generateImageStorageKey } from "~~/server/storage/keys";
import { colorCorrection } from "~~/server/utils/color/color-correction";

import { generateAvatarTrainingImageKey } from "~~/server/storage/keys";
import { runChargedWork } from "~~/server/services/user/credits";
import { FIXED_GENERATION_COSTS } from "~~/server/services/generation/generation-cost";
import { getOwnedAvatarOrThrow } from "~~/server/services/avatar/owned-avatar";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const { canvasDataURL, layoutMetadata, styleId, referenceType, avatarId, reference, avatarTrainingImageIndex } = await readBody(event);

    try {
        return await runChargedWork(user.id, FIXED_GENERATION_COSTS.sketch, async () => {
        // 1. Check if we have a style
        console.log("--- Starting sketch generation...")
        let style;
        if (styleId) {
            style = await db.query.stylesTable.findFirst({
                where: eq(stylesTable.id, styleId),
            });
            if (!style) {
                throw createError({ statusCode: 404, statusMessage: 'Style not found' });
            };
        }

        // 2. Check if we have a reference
        if (referenceType === 'image' && !reference) {
            console.log(' |- Generating without reference image');
        };
        if (referenceType === 'avatar' && !avatarId) {
            throw createError({ statusCode: 400, statusMessage: 'Avatar is required' });
        };

        // 2.1. Get the reference for an avatar if that is the case
        let referenceAvatarImageBase64: string | null = null;
        if (referenceType === 'avatar' && avatarId) {
            await getOwnedAvatarOrThrow(avatarId, user.id);
            const avatarImageKey = generateAvatarTrainingImageKey(user.id, avatarId, avatarTrainingImageIndex ?? '1');
            const avatarImage = await storage.get(avatarImageKey);
            referenceAvatarImageBase64 = avatarImage.toString('base64');
        };

        // 2.2. Set the reference image to use, if any
        let referenceImageBase64: string | null = null;
        if (referenceType === 'image' && reference) {
            referenceImageBase64 = reference;
        } else if (referenceType === 'avatar' && avatarId) {
            referenceImageBase64 = referenceAvatarImageBase64;
        }

        // 3. Send the canvas (and optional reference) to OpenRouter for image generation
        const generatedImageBuffer = await generateSketch({
            canvasDataURL,
            layoutMetadata,
            referenceType,
            avatarId,
            referenceImageBase64: referenceImageBase64 ? referenceImageBase64 : undefined,
            styleParams: style ? style.style : undefined,
        });
        if (!generatedImageBuffer) {
            console.error('-x- Failed to generate sketch');
            throw createError({ statusCode: 500, statusMessage: 'Failed to generate sketch' });
        }

        // 3.1. Color correct the image
        const correctedImageBuffer = await colorCorrection(generatedImageBuffer);

        // 4. Save the image to the database and the storage
        console.log(" |- Saving image to the database and the storage...")
        const generatedImageId = randomUUID();
        const generatedImageStorageKey = generateImageStorageKey(user.id, 'SKETCH', generatedImageId);
        await storage.put(generatedImageStorageKey, correctedImageBuffer, 'image/png');

        const [image] = await db.insert(imageTable).values({
            id: generatedImageId,
            userId: user.id,
            storageKey: generatedImageStorageKey,
            type: 'SKETCH',
            state: 'GENERATED',
            isPublic: false,
            imageMetadata: {
                url: generatedImageStorageKey,
            },
            generationMetadata: {
                prompt: SKETCH_PROMPT,
            },
        }).returning();

        // 5. Return the image
        console.log(" |- Sketch generation completed successfully 💜")
        return image;
        });
    } catch (error) {
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error;
        }
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});