import { and, eq, isNull } from "drizzle-orm";

import { db } from "~~/server/database";
import { avatarTable } from "~~/server/database/schemas/avatar.schema";

import { storage } from "~~/server/storage";
import { generateAvatarStorageKey } from "~~/server/storage/keys";

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

        const avatarStorageKey = generateAvatarStorageKey(user.id, avatar.id);
        const trainingImages = await storage.list(`${avatarStorageKey}/training-images`);

        return trainingImages.length || 0;
    } catch (error) {
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
    }
});