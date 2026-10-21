import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";

import { db } from "~~/server/database";
import { assetTable } from "~~/server/database/schemas/assets.schema";
import { saveAssetToDB } from "~~/server/services/asset";

import { storage } from "~~/server/storage";
import { generateAssetStorageKey } from "~~/server/storage/keys";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const { assedSrc } = await readBody(event);
    if (!assedSrc) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request' });
    };

    const { assetId } = getRouterParams(event);
    if (!assetId) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request' });
    }

    try {
        // 1. Fetch the original asset
        const asset = await db.query.assetTable.findFirst({
            where: and(
                eq(assetTable.id, assetId),
                eq(assetTable.userId, user.id),
            ),
        });
        if (!asset) {
            throw createError({ statusCode: 404, statusMessage: 'Asset not found' });
        }

        // 2. Save the new asset
        const newAssetId = randomUUID();
        const newAssetStorageKey = generateAssetStorageKey(user.id, asset.type, newAssetId);
        const newAssetBuffer = await fetch(assedSrc).then(res => res.arrayBuffer());
        await storage.put(newAssetStorageKey, Buffer.from(newAssetBuffer), 'image/png');
        const newAsset = await saveAssetToDB({
            userId: user.id,
            name: asset.name,
            type: asset.type,
            storageKey: newAssetStorageKey,
        });

        // 3. Return the new asset
        return newAsset;
    } catch (error) {
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});