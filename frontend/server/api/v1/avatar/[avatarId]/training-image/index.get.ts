import { and, eq, isNull } from "drizzle-orm";
import { Readable } from "stream";

import { db } from "~~/server/database";
import { avatarTable } from "~~/server/database/schemas/avatar.schema";

import { storage } from "~~/server/storage";
import { generateAvatarTrainingImageKey } from "~~/server/storage/keys";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const { avatarId } = getRouterParams(event);
    if (!avatarId) {
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
        };

        const query = getQuery(event);
        const trainingImageId = query.trainingImageId || '1';
        const trainingImageKey = generateAvatarTrainingImageKey(user.id, avatar.id, trainingImageId as string);
        const trainingImage = await storage.get(trainingImageKey);
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