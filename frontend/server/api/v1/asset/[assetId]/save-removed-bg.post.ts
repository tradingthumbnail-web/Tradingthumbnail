import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";

import { db } from "~~/server/database";
import { assetTable } from "~~/server/database/schemas/assets.schema";
import { saveAssetToDB } from "~~/server/services/asset";

import { storage } from "~~/server/storage";
import { generateAssetStorageKey } from "~~/server/storage/keys";

const DATA_URL_PATTERN = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

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
        const parsedDataUrl = DATA_URL_PATTERN.exec(assedSrc);
        if (!parsedDataUrl) {
            throw createError({ statusCode: 400, statusMessage: "Invalid image payload" });
        }
        const [, contentType, base64Payload] = parsedDataUrl;
        const newAssetBuffer = Buffer.from(base64Payload, "base64");
        if (!newAssetBuffer.length) {
            throw createError({ statusCode: 400, statusMessage: "Invalid image payload" });
        }
        if (newAssetBuffer.length > MAX_IMAGE_BYTES) {
            throw createError({ statusCode: 413, statusMessage: "Image payload too large" });
        }

        const newAssetId = randomUUID();
        const newAssetStorageKey = generateAssetStorageKey(user.id, asset.type, newAssetId);
        await storage.put(newAssetStorageKey, newAssetBuffer, contentType);
        const newAsset = await saveAssetToDB({
            userId: user.id,
            name: asset.name,
            type: asset.type,
            storageKey: newAssetStorageKey,
        });

        // 3. Return the new asset
        return newAsset;
    } catch (error) {
        if ((error as any)?.statusCode) throw error;
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});