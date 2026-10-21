import Stripe from "stripe";

import { createPolarClient } from "~~/server/services/polar/client";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const { invoiceId } = getRouterParams(event);
    if (!invoiceId) {
        throw createError({ statusCode: 400, statusMessage: "Bad Request" });
    }

    if (invoiceId.startsWith("polar:")) {
        const orderId = invoiceId.slice("polar:".length);
        try {
            const polar = createPolarClient(event);
            const order = await polar.orders.get({ id: orderId });
            const belongsToUser = order.customer?.externalId === user.id || order.customerId === user.polarCustomerId;
            if (!belongsToUser) {
                throw createError({ statusCode: 404, statusMessage: "Invoice not found" });
            }
            if (!order.isInvoiceGenerated) {
                await polar.orders.generateInvoice({ id: orderId });
            }
            const invoice = await polar.orders.invoice({ id: orderId });
            if (!invoice.url) {
                throw createError({ statusCode: 404, statusMessage: "Invoice not found" });
            }
            return { invoiceUrl: invoice.url };
        } catch (error: any) {
            if (error?.statusCode) throw error;
            console.error("Error downloading Polar invoice", error);
            throw createError({ statusCode: 500, statusMessage: "Internal server error" });
        }
    }

    const config = useRuntimeConfig(event);
    const stripeSecretKey = config.stripe.secretKey;
    if (!stripeSecretKey) {
        throw createError({ statusCode: 500, statusMessage: "Stripe secret key not found" });
    }

    try {
        const stripe = new Stripe(stripeSecretKey);
        const invoice = await stripe.invoices.retrieve(invoiceId);
        if (!invoice || !invoice.hosted_invoice_url) {
            throw createError({ statusCode: 404, statusMessage: "Invoice not found" });
        }
        return { invoiceUrl: invoice.hosted_invoice_url };
    } catch (error: any) {
        if (error?.statusCode) throw error;
        console.error("Error downloading invoice", error);
        throw createError({ statusCode: 500, statusMessage: "Internal server error" });
    }
});
