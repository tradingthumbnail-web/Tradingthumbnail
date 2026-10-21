import Stripe from 'stripe';

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.email || !user.id) {
        console.error('User not found');
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    };

    const { productId, priceId, tierId } = await readBody(event);
    if (!productId || !priceId) {
        console.error('Product ID or price ID not found');
        throw createError({ statusCode: 400, statusMessage: 'Bad Request' });
    };

    const config = useRuntimeConfig(event);
    const stripeSecretKey = config.stripe.secretKey;
    const appUrl = config.public.appUrl;
    if (!stripeSecretKey) {
        console.error('Stripe secret key is not set');
        throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
    };

    let session: Stripe.Checkout.Session | null = null;
    try {
        const stripe = new Stripe(stripeSecretKey);
        session = await stripe.checkout.sessions.create({
            success_url: `${appUrl}/settings/plans/success?tierId=${tierId}&userId=${user.id}`,
            cancel_url: `${appUrl}/settings/plans/cancel`,
            line_items: [{
                price: priceId,
                quantity: 1
            }],
            mode: 'subscription',
            customer_email: user.email,
            allow_promotion_codes: true,
            metadata: {
                tierId,
                priceId,
                userId: user.id,
            }
        });

        console.log(' |- Checkout session created successfully');
        if (session) {
            return {
                checkoutUrl: session.url,
            }
        } else {
            throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
        }
    } catch (error: any) {
        console.error(error);
        if (error.statusCode) {
            throw error;
        };
        throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
    }
});