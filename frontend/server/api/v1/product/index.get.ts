import { db } from "~~/server/database";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    try {
        const products = await db.query.productTable.findMany();

        return products;
    } catch (error) {
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});