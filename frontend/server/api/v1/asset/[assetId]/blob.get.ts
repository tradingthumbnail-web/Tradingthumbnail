import { and, eq } from "drizzle-orm";
import { db } from "~~/server/database";
import { assetTable } from "~~/server/database/schemas/assets.schema";
import { storage } from "~~/server/storage";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const { assetId } = getRouterParams(event);
    if (!assetId) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request' });
    }

    try {
        const asset = await db.query.assetTable.findFirst({
            where: and(
                eq(assetTable.id, assetId),
                eq(assetTable.userId, user.id),
            ),
        });
        if (!asset) {
            throw createError({ statusCode: 404, statusMessage: 'Asset not found' });
        }

        const assetBuffer = await storage.get(asset.storageKey);
        return assetBuffer;
    } catch (error) {
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});