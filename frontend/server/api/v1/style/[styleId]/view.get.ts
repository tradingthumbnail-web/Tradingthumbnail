import { and, eq, or } from "drizzle-orm";
import { Readable } from "stream";

import { db } from "~~/server/database";
import { stylesTable } from "~~/server/database/schemas/style.schema";

import { storage } from "~~/server/storage";
import { generateStyleStorageKey } from "~~/server/storage/keys";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }
    const { styleId } = getRouterParams(event);
    if (!styleId) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request' });
    }

    try {
        const style = await db.query.stylesTable.findFirst({
            where: and(
                eq(stylesTable.id, styleId),
                or(
                    eq(stylesTable.isPublic, true),
                    eq(stylesTable.createdBy, user.id),
                ),
            ),
        });
        if (!style) {
            console.error("-x- Style not found");
            throw createError({ statusCode: 404, statusMessage: 'Style not found' });
        };

        const styleStorageKey = generateStyleStorageKey(style.id);

        const styleBuffer = await storage.get(styleStorageKey);
        const reader = new Readable();
        reader.push(styleBuffer);
        reader.push(null);

        setHeader(event, 'Content-Type', 'image/png');

        return sendStream(event, reader);
    } catch (error) {
        console.error("-x- Error viewing style", error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});