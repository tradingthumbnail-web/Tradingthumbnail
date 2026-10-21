import { Readable } from "stream";
import { eq, and, isNull } from "drizzle-orm";

import { db } from "~~/server/database";
import { avatarTable } from "~~/server/database/schemas/avatar.schema";

import { storage } from "~~/server/storage";
import { generateAvatarTrainingImageKey } from "~~/server/storage/keys";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const { avatarId, trainingImageId } = getRouterParams(event);
    if (!avatarId || !trainingImageId) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request' });
    }

    try {
        const avatar = await db.query.avatarTable.findFirst({
            where: and(
                eq(avatarTable.id, avatarId),
                eq(avatarTable.userId, user.id),
                isNull(avatarTable.deletedAt),
            ),
        });
        if (!avatar) {
            throw createError({ statusCode: 404, statusMessage: 'Avatar not found' });
        }

        const trainingImageStorageKey = generateAvatarTrainingImageKey(user.id, avatar.id, trainingImageId);
        const trainingImage = await storage.get(trainingImageStorageKey);
        if (!trainingImage) {
            throw createError({ statusCode: 404, statusMessage: 'Training image not found' });
        }

        const reader = new Readable();
        reader.push(trainingImage);
        reader.push(null);
        return sendStream(event, reader);
    } catch (error) {
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
    }
});