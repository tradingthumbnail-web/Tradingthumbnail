import { randomUUID } from "crypto";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "~~/server/database";
import { avatarTable } from "~~/server/database/schemas/avatar.schema";
import { type ModelName } from "~~/server/constants/models-db";
import { generateAvatarWeightsKey, generateImageStorageKey } from "~~/server/storage/keys";

import { storage } from "~~/server/storage";
import { generatePhotoshootImages, FLUX_KONTEXT_LORA_PARAMS } from "~~/server/services/fal/generate-photoshoot";
import { optimizePhotoshootPrompt } from "~~/server/services/prompt/optimize-prompt";
import { Image } from "~~/server/database/schemas/image.schema";
import { saveImageToDB } from "~~/server/services/image.service";
import { saveActivity } from "~~/server/services/activity/save-activity";
import { runChargedWork } from "~~/server/services/user/credits";
import { clampPhotoshootVariations, computePhotoshootCost } from "~~/server/services/generation/generation-cost";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidAvatarId(value: unknown): value is string {
    return typeof value === "string" && UUID_PATTERN.test(value.trim());
}

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    };

    const {
        avatarId,
        description,
        expression,
        cameraAngle,
        background,
        variations,
        reference,
    } = await readBody(event);

    if (!isValidAvatarId(avatarId)) {
        throw createError({ statusCode: 400, statusMessage: 'A valid avatar is required' });
    }
    const normalizedAvatarId = avatarId.trim();

    console.log(" |- Reference: ", description);

    const variationCount = clampPhotoshootVariations(variations);

    // 1. Fetch and check the avatar before deducting credits
    const avatar = await db.query.avatarTable.findFirst({
        where: and(
            eq(avatarTable.id, normalizedAvatarId),
            eq(avatarTable.userId, user.id),
            isNull(avatarTable.deletedAt),
        ),
    });
    if (!avatar) {
        throw createError({ statusCode: 404, statusMessage: 'Avatar not found' });
    }
    if (avatar.status !== 'TRAINED') {
        throw createError({ statusCode: 400, statusMessage: 'Avatar training is not complete' });
    }

    try {
        return await runChargedWork(user.id, computePhotoshootCost(variationCount), async () => {
        // 2. Get the weights presigned URL
        console.log("--- Initializing photoshoot generation...")
        const weightsStorageKey = generateAvatarWeightsKey(user.id, avatar.id, avatar.storageKey);
        const weightsPresignedUrl = await storage.generatePresignedUrl(weightsStorageKey, 3600 * 24);

        // 2.1. Improve the prompt
        console.log(" |- Optimizing prompt...")
        const optimizedPrompt = await optimizePhotoshootPrompt(description, expression, cameraAngle, background, avatar.gender);
        if (!optimizedPrompt) {
            throw createError({ statusCode: 500, statusMessage: 'Failed to optimize prompt' });
        }
        console.log(" |- Optimized prompt: ", optimizedPrompt);
        // 3. Generate the images with the model
        console.log(" |- Generating images with the model...")
        let model: ModelName = "fal-ai/flux-lora";
        const images = await generatePhotoshootImages({
            model,
            prompt: optimizedPrompt,
            numberOfImages: variationCount,
            weightsPresignedUrl,
            imageSize: 'landscape_4_3',
        });

        // 4. Save the images to the database and the storage
        const savedImages: Image[] = [];
        console.log(" |- Saving images to the database and the storage...")
        for (const imageURL of images) {
            const imageId = randomUUID();
            const imageStorageKey = generateImageStorageKey(user.id, 'CHARACTER', imageId);

            const imageBuffer = await fetch(imageURL).then(res => res.arrayBuffer());
            await storage.put(imageStorageKey, Buffer.from(imageBuffer), 'image/png');

            const image = await saveImageToDB({
                userId: user.id,
                imageId,
                storageKey: imageStorageKey,
                type: 'CHARACTER',
                state: 'GENERATED',
                isPublic: false,
                imageMetadata: {
                    url: imageURL,
                    prompt: optimizedPrompt,
                },
                generationMetadata: {
                    prompt: optimizedPrompt,
                    numberOfImages: variationCount,
                    imageSize: 'landscape_4_3',
                },
            });
            savedImages.push(image);
        };

        await saveActivity({
            userId: user.id,
            targetType: "IMAGE",
            targetId: savedImages[0].id,
            eventType: "image.generated",
            payload: {
                ...FLUX_KONTEXT_LORA_PARAMS,
            },
        });

        // 5. Return the images
        console.log(" |- Photoshoot generation completed successfully 💜")
        return savedImages;
        });
    } catch (error) {
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error;
        }
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});