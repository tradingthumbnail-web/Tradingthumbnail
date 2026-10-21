import { randomUUID } from "crypto";

import { storage } from "~~/server/storage";
import { generateStyleStorageKey } from "~~/server/storage/keys";

import { db } from "~~/server/database";
import { stylesTable } from "~~/server/database/schemas/style.schema";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id || user.role !== 'ADMIN') {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const { name, description, style, isPublic, version, tags, base64Image } = await readBody(event);
    if (!name || !style || !base64Image) {
        throw createError({ statusCode: 400, statusMessage: 'Name, style and base64Image are required' });
    }

    try {
        const styleId = randomUUID();

        // Convert the image to a buffer and upload it to the storage
        const imageBuffer = Buffer.from(base64Image, 'base64');
        const styleStorageKey = generateStyleStorageKey(styleId);
        await storage.put(styleStorageKey, imageBuffer, 'image/png');

        await db.insert(stylesTable).values({
            id: styleId,
            name,
            description,
            style,
            isPublic,
            version,
            tags,
            createdBy: user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return styleId;

    } catch (error) {
        console.error("-x- Error creating style", error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});