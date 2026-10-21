import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import sharp from "sharp";

import { db } from "~~/server/database";
import { imageTable } from "~~/server/database/schemas/image.schema";
import { saveImageToDB } from "~~/server/services/image.service";

import { storage } from "~~/server/storage";
import { generateImageStorageKey } from "~~/server/storage/keys";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const { canvasDataURL, imageId, imageRectangle } = await readBody(event);
    if (!canvasDataURL || !imageId || !imageRectangle) {
        throw createError({ statusCode: 400, statusMessage: 'Canvas data URL and image ID are required' });
    }

    if (
        typeof imageRectangle.left !== 'number' ||
        typeof imageRectangle.top !== 'number' ||
        typeof imageRectangle.width !== 'number' ||
        typeof imageRectangle.height !== 'number'
    ) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid imageRectangle format' });
    }
    
    try {
        // Fetch the base image
        const baseImage = await db.query.imageTable.findFirst({
            where: and(
                eq(imageTable.id, imageId),
                eq(imageTable.userId, user.id),
            ),
        });
        if (!baseImage) {
            throw createError({ statusCode: 404, statusMessage: 'Base image not found' });
        }

        const newImageId = randomUUID();
        const newImageStorageKey = generateImageStorageKey(user.id, 'GENERATION', newImageId);

        // Convert the ©anvas data url to a buffer and upload it to the storage
        const imageBuffer = await fetch(canvasDataURL).then(res => res.arrayBuffer());
        const image = await sharp(imageBuffer).extract({
            left: imageRectangle.left,
            top: imageRectangle.top,
            width: imageRectangle.width,
            height: imageRectangle.height,
        }).toBuffer();

        await storage.put(newImageStorageKey, Buffer.from(image), 'image/png');

        // Save the image 
        const savedImage = await saveImageToDB({
            userId: user.id,
            imageId: newImageId,
            storageKey: newImageStorageKey,
            parentId: baseImage.id,
            rootId: baseImage.rootId ? baseImage.rootId : baseImage.id,
            type: baseImage.type || 'GENERATION',
            state: 'GENERATED',
            isPublic: false,
            imageMetadata: {
                ...baseImage.imageMetadata,
            },
            generationMetadata: {
                ...baseImage.generationMetadata,
            },
        });

        // 3. Return the image
        console.log(" |- New version of the image saved yay 💜")
        return savedImage;
    } catch (error) {
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});