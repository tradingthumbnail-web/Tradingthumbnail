import { db } from "~~/server/database";
import { assetTable } from "~~/server/database/schemas/assets.schema";

import { eq, or, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    try {
        const assets = await db.query.assetTable.findMany({
            where: or(
                eq(assetTable.userId, user.id),
                eq(assetTable.isPublic, true),
            ),
            orderBy: [desc(assetTable.createdAt)],
        });

        return assets;
    } catch (error) {
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});