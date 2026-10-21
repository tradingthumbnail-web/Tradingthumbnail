import { and, eq } from "drizzle-orm";

import { db } from "~~/server/database";
import { imageTable } from "~~/server/database/schemas/image.schema";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const { imageId } = getRouterParams(event);
    if (!imageId) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request' });
    };

    try {
        const image = await db.query.imageTable.findFirst({
            where: and(
                eq(imageTable.id, imageId),
                eq(imageTable.userId, user.id),
            ),
        });
        if (!image) {
            throw createError({ statusCode: 404, statusMessage: 'Image not found' });
        };

        return image;
    } catch (error) {
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    };
});