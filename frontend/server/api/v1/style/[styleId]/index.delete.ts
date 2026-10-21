import { eq } from "drizzle-orm";

import { db } from "~~/server/database";
import { stylesTable } from "~~/server/database/schemas/style.schema";

import { storage } from "~~/server/storage";
import { generateStyleStorageKey } from "~~/server/storage/keys";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id || user.role !== 'ADMIN') {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }
    const { styleId } = getRouterParams(event);
    if (!styleId) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request' });
    }

    try {
        const style = await db.query.stylesTable.findFirst({
            where: eq(stylesTable.id, styleId),
        });
        if (!style) {
            throw createError({ statusCode: 404, statusMessage: 'Style not found' });
        }
        
        await db.delete(stylesTable).where(eq(stylesTable.id, styleId));

        const styleStorageKey = generateStyleStorageKey(style.id);
        try {
            await storage.delete(styleStorageKey);
        } catch (error) {
            console.warn("-x- Error deleting style from storage. Style image not found.", error);
        }

        return {
            message: 'Style deleted successfully',
        };
    } catch (error) {
        console.error("-x- Error deleting style", error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});