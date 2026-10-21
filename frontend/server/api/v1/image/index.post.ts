import { randomUUID } from "crypto";
import { saveImageToDB } from "~~/server/services/image.service";

import { storage } from "~~/server/storage";
import { generateImageStorageKey } from "~~/server/storage/keys";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const { imageSrc } = await readBody(event);
    if (!imageSrc) {
        throw createError({ statusCode: 400, statusMessage: 'Image source is required' });
    }

    try {
        const imageId = randomUUID();
        const imageStorageKey = generateImageStorageKey(user.id, 'GENERATION', imageId);

        // Download the image url and convert it to a buffer and upload it to the storage
        const imageBuffer = await fetch(imageSrc).then(res => res.arrayBuffer());
        await storage.put(imageStorageKey, Buffer.from(imageBuffer), 'image/png');

        // Save the image to the database
        const image = await saveImageToDB({
            userId: user.id,
            imageId,
            storageKey: imageStorageKey,
            type: 'GENERATION',
            state: 'GENERATED',
            isPublic: false,
            imageMetadata: {
                url: imageSrc,
            },
        });

        // Return the image
        return image;
    } catch (error) {
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});