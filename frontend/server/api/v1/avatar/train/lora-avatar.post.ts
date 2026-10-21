import archiver from "archiver";
import { PassThrough } from "stream";
import { randomUUID } from "crypto";
import { desc, eq, and, gte, sql } from "drizzle-orm";

import { db } from "~~/server/database";
import { subscriptionTable } from "~~/server/database/schemas/subscription.schema";
import { userTable } from "~~/server/database/schemas/user.schema";
import { avatarTable } from "~~/server/database/schemas/avatar.schema";


import { AVATAR_TRAINING_PARAMETERS, FAL_AVATAR_LORA_TRAINING_MODEL_ENDPOINT } from "~~/server/constants/avatar-training";
import { generateAvatarStorageKey, generateAvatarTrainingImageKey } from "~~/server/storage/keys";
import { cropImageToSquare, cropImageToSquareBuffer } from "~~/server/utils/images";
import { trainAvatarLoraModel } from "~~/server/services/fal/train-avatar-lora-model";

import { storage } from "~~/server/storage";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({
            statusMessage: "Unauthorized",
            statusCode: 401
        });
    }

    const { 
        name, 
        genre, 
        files, uploadId }: { 
            name: string, 
            genre: string, 
            files: { 
                base64string?: string, 
                fileType?: string,
                storageKey?: string
            }[],
            uploadId?: string
        } = await readBody(event);

    if (!name || name.length > 100 || !genre || !['male', 'female', 'other'].includes(genre.toLowerCase()) || !files || files.length < 15 || files.length > 20) {
        throw createError({
            statusMessage: "Bad Request",
            statusCode: 400
        });
    }

    const usesStorageKeys = files.every((f) => !!f.storageKey);
    const usesBase64 = files.every((f) => !!f.base64string);
    if (!usesStorageKeys && !usesBase64) {
        throw createError({
            statusMessage: "Bad Request",
            statusCode: 400
        });
    }
    if (usesStorageKeys && !uploadId) {
        throw createError({
            statusMessage: "Bad Request",
            statusCode: 400
        });
    }
    if (usesBase64 && files.some((f) => (f.base64string?.length || 0) > 2 * 1024 * 1024)) {
        throw createError({
            statusMessage: "Bad Request",
            statusCode: 400
        });
    }

    try {
        console.log('--- Starting avatar training...')
        // 1. Fetch user and check if it has avatar credits to train the avatar
        const fetchedUser = await db.query.userTable.findFirst({
            where: eq(userTable.id, user.id),
            with: {
                avatars: true
            }
        });
        if (!fetchedUser) {
            throw createError({
                statusMessage: "User not found",
                statusCode: 404
            });
        };

        if (fetchedUser.avatarCredit < 1) {
            throw createError({
                statusMessage: "User has no avatar credits",
                statusCode: 403
            });
        };

        // 2. Check if the user has a subscription - avatar slots limit only applies to subscribed users
        const activeSubscription = await db.query.subscriptionTable.findFirst({
            where: eq(subscriptionTable.userId, user.id),
            with: {
                tier: true
            },
            orderBy: desc(subscriptionTable.endsAt),
        });
        
        if (activeSubscription && activeSubscription.tier) {
            const maxAvatars = activeSubscription.tier.avatarSlots;
            if (fetchedUser.avatars.length >= maxAvatars) {
                throw createError({
                    statusMessage: "User has reached the maximum number of avatars for their subscription tier.",
                    statusCode: 403
                });
            }
        } else {
            if (fetchedUser.avatars.length >= 1) {
                throw createError({
                    statusMessage: "User has reached the maximum number of avatars for their subscription tier.",
                    statusCode: 403
                });
            }
        }
        
        // 3. Prepare the images in a zip folder for the training and all the necessary data
        const avatarId = randomUUID();
        const avatarStorageKey = generateAvatarStorageKey(user.id, avatarId);
        console.log(' |- Avatar storage key: ', avatarStorageKey);

        const archive = archiver('zip', {
            zlib: { level: 9 },
        });
        const zipBuffers: Buffer[] = [];
        const zipStream = new PassThrough();
        console.log(' |- Zip stream created');

        zipStream.on('data', (chunk) => {
            zipBuffers.push(chunk);
        });
        archive.pipe(zipStream);
        console.log(' |- Archive piped to zip stream');

        // 4. Save the images to the storage and add them to the archive
        const expectedPrefix = uploadId ? `avatar-training-uploads/${user.id}/${uploadId}/` : null;
        for (const [index, file] of files.entries()) {
            console.log(' |- Processing image: ', index + 1);
            const trainingImageKey = generateAvatarTrainingImageKey(user.id, avatarId, (index + 1).toString());

            // 4.1. Crop image to a square if it is not already
            let croppedImageBuffer: Buffer;
            if (file.storageKey) {
                if (!expectedPrefix || !file.storageKey.startsWith(expectedPrefix)) {
                    throw createError({
                        statusMessage: "Bad Request",
                        statusCode: 400
                    });
                }
                const originalBuffer = await storage.get(file.storageKey);
                croppedImageBuffer = await cropImageToSquareBuffer(originalBuffer);
                await storage.delete(file.storageKey);
            } else if (file.base64string) {
                croppedImageBuffer = await cropImageToSquare(file.base64string);
            } else {
                throw createError({
                    statusMessage: "Bad Request",
                    statusCode: 400
                });
            }
            archive.append(croppedImageBuffer, { name: trainingImageKey });

            // 4.2. Upload the image to the storage
            await storage.put(trainingImageKey, croppedImageBuffer, 'image/jpeg');
            console.log(' |- Image uploaded to storage');
        };
        console.log(' |- All images processed fine, zipping the archive...');
        archive.finalize();
        
        // 4.3. Collect the zip buffer
        const zipBuffer = Buffer.concat(zipBuffers);
        console.log(' |- Archive finalized, uploading to storage...');
        const zipStorageKey = `${avatarStorageKey}/images.zip`;
        await storage.put(zipStorageKey, zipBuffer, 'application/zip');
        console.log(' |- Zip uploaded to storage');

        // 4.4. Generate a presigned URL for the zip
        const expirationTimeInSeconds = 3600 * 24;
        const zipPresignedUrl = await storage.generatePresignedUrl(zipStorageKey, expirationTimeInSeconds);
        console.log(' |- Zip presigned URL: ', zipPresignedUrl.slice(0, 20));

        // 5. Start the training
        const requestId = await trainAvatarLoraModel(zipPresignedUrl);
        console.log(' |- Training request ID: ', requestId);

        // 6. Save the avatar to the database with the training metadata
        await db.insert(avatarTable).values({
            id: avatarId,
            userId: user.id,
            ownerId: user.id,
            name,
            gender: genre.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER',
            storageKey: avatarStorageKey,
            status: 'TRAINING',
            trainingMetadata: {
                requestId,
                trainingImages: files.length,
                trainingSteps: AVATAR_TRAINING_PARAMETERS.steps,
                baseModel: FAL_AVATAR_LORA_TRAINING_MODEL_ENDPOINT,
                triggerPhrase: AVATAR_TRAINING_PARAMETERS.trigger_phrase,
                startedAt: new Date().toISOString()
            },
            trainedAt: new Date()
        });
        console.log(' |- Avatar saved to database');

        // 7. Deduct avatar credit from user
        const result = await db
            .update(userTable)
            .set({
                avatarCredit: sql`${userTable.avatarCredit} - 1`
            })
            .where(and(eq(userTable.id, user.id), gte(userTable.avatarCredit, 1)))
            .returning({ avatarCredit: userTable.avatarCredit });
        if (result.length === 0) {
            throw createError({
                statusMessage: "User has no avatar credits",
                statusCode: 403
            });
        }
        console.log(' |- Avatar credit deducted from user');

        // 8. Return success and wait for the webhook to finish the training
        console.log('--- Avatar training started successfully');
        return {
            success: true,
            message: 'Avatar training started successfully',
            avatarId,
            requestId,
            status: 'TRAINING'
        };

    } catch (error) {
        console.error(error);
        throw createError({
            statusMessage: "Internal Server Error",
            statusCode: 500
        });
    }
});