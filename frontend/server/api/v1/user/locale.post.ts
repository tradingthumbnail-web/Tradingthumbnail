import { eq } from "drizzle-orm";

import { db } from "~~/server/database";
import { userTable } from "~~/server/database/schemas/user.schema";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const SUPPORTED_LOCALES = ['en', 'ca', 'es'] as const;
    
    const { locale } = await readBody(event);
    if (!locale) {
        throw createError({ statusCode: 400, statusMessage: 'Locale is required' });
    }
    
    if (!SUPPORTED_LOCALES.includes(locale)) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid locale' });
    }

    try {
        await db.update(userTable).set({
            locale: locale,
        }).where(eq(userTable.id, user.id));

        return { statusCode: 200, statusMessage: 'Locale changed successfully' };
        
    } catch (error) {
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});