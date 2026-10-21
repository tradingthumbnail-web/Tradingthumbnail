import { eq } from "drizzle-orm";

import { db } from "~~/server/database";
import { productTable } from "~~/server/database/schemas/product.schema";
import { createPolarClient } from "~~/server/services/polar/client";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id || !user.email) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const { productId } = await readBody(event);
    if (!productId) {
        throw createError({ statusCode: 400, statusMessage: "Product ID is required" });
    }

    const product = await db.query.productTable.findFirst({
        where: eq(productTable.id, productId),
    });
    if (!product) {
        throw createError({ statusCode: 400, statusMessage: "Product not found" });
    }
    if (!product.polarProductId) {
        throw createError({ statusCode: 503, statusMessage: "Polar product is not configured" });
    }

    const config = useRuntimeConfig(event);
    const appUrl = config.public.appUrl;
    if (!appUrl) {
        throw createError({ statusCode: 500, statusMessage: "App URL is not configured" });
    }

    try {
        const polar = createPolarClient(event);
        const checkout = await polar.checkouts.create({
            products: [product.polarProductId],
            customerEmail: user.email,
            customerName: user.name,
            externalCustomerId: user.id,
            allowDiscountCodes: true,
            successUrl: `${appUrl}/settings/products/success?productId=${product.id}&checkout_id={CHECKOUT_ID}`,
            returnUrl: `${appUrl}/settings/products/cancel`,
            metadata: {
                userId: user.id,
                productId: product.id,
            },
        });

        if (!checkout.url) {
            throw createError({ statusCode: 500, statusMessage: "Failed to create Polar checkout session" });
        }

        return { checkoutUrl: checkout.url };
    } catch (error: any) {
        if (error?.statusCode) throw error;
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: "Internal server error" });
    }
});
