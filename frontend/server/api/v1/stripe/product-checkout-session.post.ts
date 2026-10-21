import Stripe from 'stripe';
import { eq } from 'drizzle-orm';

import { db } from '~~/server/database';
import { productTable } from '~~/server/database/schemas/product.schema';

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    const config = useRuntimeConfig(event);
    const stripeSecretKey = config.stripe.secretKey;
    if (!stripeSecretKey) {
        throw createError({ statusCode: 500, statusMessage: 'Stripe secret key not found' });
    }

    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const { productId } = await readBody(event);
    if (!productId) {
        throw createError({ statusCode: 400, statusMessage: 'Product ID is required' });
    }

    try {
        // 0. Initiate stripe
        const stripe = new Stripe(stripeSecretKey);

        // 1. Get the product
        const product = await db.query.productTable.findFirst({
            where: eq(productTable.id, productId),
        });
        if (!product) {
            console.error(' |- Product not found');
            throw createError({ statusCode: 400, statusMessage: 'Product not found' });
        }

        const stripeProduct = await stripe.products.retrieve(product.stripeProductId as string);
        if (!stripeProduct) {
            console.error(' |- Stripe product not found');
            throw createError({ statusCode: 400, statusMessage: 'Stripe product not found' });
        }

        // 2. Get the price id from stripe
        const price = await stripe.prices.retrieve(stripeProduct.default_price as string);
        if (!price) {
            console.error(' |- Price not found');
            throw createError({ statusCode: 400, statusMessage: 'Price not found' });
        }

        // 3. Create a checkout session
        const session = await stripe.checkout.sessions.create({
            success_url: `${config.public.appUrl}/settings/products/success?productId=${productId}`,
            cancel_url: `${config.public.appUrl}/settings/products/cancel`,
            line_items: [{
                price: price.id,
                quantity: 1
            }],
            mode: 'payment',
            customer_email: user.email,
            allow_promotion_codes: true,
            metadata: {
                productId,
                userId: user.id,
                productName: product.name.toLowerCase()
            }
        });
        if (!session) {
            throw createError({ statusCode: 500, statusMessage: 'Failed to create checkout session' });
        }
        // 3. Return the checkout url
        return {
            checkoutUrl: session.url,
        }
    } catch (error) {
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});