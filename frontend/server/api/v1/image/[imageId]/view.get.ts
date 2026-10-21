import { and, eq } from "drizzle-orm";
import { Readable } from "stream";
import crypto from "crypto";

import { db } from "~~/server/database";
import { imageTable } from "~~/server/database/schemas/image.schema";

import { storage } from "~~/server/storage";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const { imageId } = getRouterParams(event);
    if (!imageId) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request' });
    }

    try {
        const image = await db.query.imageTable.findFirst({
            where: and(
                eq(imageTable.id, imageId),
                eq(imageTable.userId, user.id),
            ),
        });
        if (!image) {
            throw createError({ statusCode: 404, statusMessage: 'Image not found' });
        }

        const imageBuffer = await storage.get(image.storageKey);
        
        // Detect MIME type from buffer magic bytes
        let contentType = 'application/octet-stream';
        if (imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8 && imageBuffer[2] === 0xFF) {
            contentType = 'image/jpeg';
        } else if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50 && imageBuffer[2] === 0x4E && imageBuffer[3] === 0x47) {
            contentType = 'image/png';
        } else if (imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49 && imageBuffer[2] === 0x46) {
            contentType = 'image/gif';
        } else if (imageBuffer[0] === 0x52 && imageBuffer[1] === 0x49 && imageBuffer[2] === 0x46 && imageBuffer[3] === 0x46) {
            contentType = 'image/webp';
        }
        
        // Generate ETag for cache validation
        const etag = `"${crypto.createHash('md5').update(imageBuffer).digest('hex')}"`;
        
        // Check If-None-Match for conditional request
        const clientEtag = getHeader(event, 'if-none-match');
        if (clientEtag === etag) {
            setResponseStatus(event, 304);
            return;
        }
        
        // Set cache headers
        setHeader(event, 'Content-Type', contentType);
        setHeader(event, 'Content-Length', imageBuffer.length);
        setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable');
        setHeader(event, 'ETag', etag);
        setHeader(event, 'Last-Modified', new Date(image.createdAt).toUTCString());
        
        const reader = new Readable();
        reader.push(imageBuffer);
        reader.push(null);

        return sendStream(event, reader);
    } catch (error) {
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});