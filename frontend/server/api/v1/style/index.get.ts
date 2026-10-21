import { eq, or } from "drizzle-orm";

import { db } from "~~/server/database";
import { stylesTable } from "~~/server/database/schemas/style.schema";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    try {
        const styles = await db.query.stylesTable.findMany({
            where: or(
                eq(stylesTable.isPublic, true),
                eq(stylesTable.createdBy, user.id),
            ),
        });

        return styles;
    } catch (error) {
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});