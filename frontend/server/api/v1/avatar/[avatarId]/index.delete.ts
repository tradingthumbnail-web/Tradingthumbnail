import { eq, and } from "drizzle-orm";

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
            where: eq(avatarTable.id, avatarId),
        });
        if (!avatar) {
            throw createError({ statusCode: 404, statusMessage: 'Avatar not found' });
        }

        if (avatar.ownerId !== user.id) {
            throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
        };

        await db.delete(avatarTable).where(
            and(
                eq(avatarTable.id, avatarId),
                eq(avatarTable.ownerId, user.id)
            )
        );

        const avatarStorageKey = generateAvatarStorageKey(user.id, avatarId);
        await storage.deleteAllFilesInFolder(avatarStorageKey);

        return {
            message: 'Avatar deleted successfully',
        };
    } catch (error) {
        if (error && typeof error === "object" && "statusCode" in error) {
            throw error;
        }
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
    }
});