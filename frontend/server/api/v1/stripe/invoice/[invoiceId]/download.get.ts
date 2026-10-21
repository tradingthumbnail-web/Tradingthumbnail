import Stripe from 'stripe';

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const { invoiceId } = getRouterParams(event);
    if (!invoiceId) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request' });
    }

    const config = useRuntimeConfig(event);
    const stripeSecretKey = config.stripe.secretKey;
    if (!stripeSecretKey) {
        throw createError({ statusCode: 500, statusMessage: 'Stripe secret key not found' });
    }
    
    try {
        const stripe = new Stripe(stripeSecretKey);
        const invoice = await stripe.invoices.retrieve(invoiceId);

        if (!invoice || !invoice.hosted_invoice_url) {
            throw createError({ statusCode: 404, statusMessage: 'Invoice not found' });
        }

        return {
            invoiceUrl: invoice.hosted_invoice_url,
        };
    } catch (error) {
        console.error("Error downloading invoice", error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});