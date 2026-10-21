import { eq, isNull, and } from "drizzle-orm";

import { db } from "~~/server/database";
import { avatarTable } from "~~/server/database/schemas/avatar.schema";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }
    
    try {
        const avatars = await db.query.avatarTable.findMany({
            where: and(
                eq(avatarTable.userId, user.id),
                isNull(avatarTable.deletedAt),
            ),
        });

        return avatars;
    } catch (error) {
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    };
});