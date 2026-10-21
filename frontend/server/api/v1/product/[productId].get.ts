import { eq } from "drizzle-orm";
import { db } from "~~/server/database";
import { productTable } from "~~/server/database/schemas/product.schema";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const { productId } = getRouterParams(event);
    if (!productId) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request' });
    }

    try {
        const product = await db.query.productTable.findFirst({
            where: eq(productTable.id, productId),
        });

        if (!product) {
            throw createError({ statusCode: 404, statusMessage: 'Product not found' });
        }

        return product;
    } catch (error) {
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});
