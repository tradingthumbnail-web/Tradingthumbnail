import { Readable } from "stream";
import { eq, and, or } from "drizzle-orm";

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
                or(
                    eq(assetTable.userId, user.id),
                    eq(assetTable.isPublic, true),
                ),
            ),
        });
        if (!asset) {
            throw createError({ statusCode: 404, statusMessage: 'Asset not found' });
        }

        const assetBuffer = await storage.get(asset.storageKey);
        
        // Detect MIME type from buffer magic bytes
        let contentType = 'application/octet-stream';
        if (assetBuffer[0] === 0xFF && assetBuffer[1] === 0xD8 && assetBuffer[2] === 0xFF) {
            contentType = 'image/jpeg';
        } else if (assetBuffer[0] === 0x89 && assetBuffer[1] === 0x50 && assetBuffer[2] === 0x4E && assetBuffer[3] === 0x47) {
            contentType = 'image/png';
        } else if (assetBuffer[0] === 0x47 && assetBuffer[1] === 0x49 && assetBuffer[2] === 0x46) {
            contentType = 'image/gif';
        } else if (assetBuffer[0] === 0x52 && assetBuffer[1] === 0x49 && assetBuffer[2] === 0x46 && assetBuffer[3] === 0x46) {
            contentType = 'image/webp';
        }
        
        // Set Content-Type header
        setHeader(event, 'Content-Type', contentType);
        
        const reader = new Readable();
        reader.push(assetBuffer);
        reader.push(null);

        return sendStream(event, reader);
    } catch (error) {
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});