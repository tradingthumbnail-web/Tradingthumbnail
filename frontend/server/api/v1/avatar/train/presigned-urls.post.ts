import { randomUUID } from "crypto";

import { storage } from "~~/server/storage";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({
            statusMessage: "Unauthorized",
            statusCode: 401
        });
    }

    const { files }: { files: { fileType: string }[] } = await readBody(event);
    if (!files || files.length < 15 || files.length > 20) {
        throw createError({
            statusMessage: "Bad Request",
            statusCode: 400
        });
    }
    const allowedTypes = new Set(["image/jpeg"]);
    if (files.some((file) => !allowedTypes.has(file.fileType))) {
        throw createError({
            statusMessage: "Bad Request",
            statusCode: 400
        });
    }

    try {
        const uploadId = randomUUID();
        const uploads = await Promise.all(files.map(async (file, index) => {
            const storageKey = `avatar-training-uploads/${user.id}/${uploadId}/${index + 1}.jpg`;
            const uploadUrl = await storage.generatePresignedUploadUrl(storageKey, file.fileType);
            return { storageKey, uploadUrl };
        }));

        return { uploadId, uploads };
    } catch (error) {
        console.error(error);
        throw createError({
            statusMessage: "Internal Server Error",
            statusCode: 500
        });
    }
});