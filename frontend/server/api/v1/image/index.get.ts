import { desc, eq } from "drizzle-orm";

import { db } from "~~/server/database";
import { imageTable } from "~~/server/database/schemas/image.schema";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const query = getQuery(event);
    const limit = query.limit ? parseInt(query.limit as string) : undefined;
    const offset = query.offset ? parseInt(query.offset as string) : undefined;

    try {
        const images = await db.query.imageTable.findMany({
            where: eq(imageTable.userId, user.id),
            orderBy: desc(imageTable.createdAt),
            limit: limit,
            offset: offset,
        });

        return images;
    } catch (error) {
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});