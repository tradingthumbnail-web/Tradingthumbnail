import Stripe from "stripe";
import type { Order } from "@polar-sh/sdk/models/components/order.js";

import { createPolarClient, getPolarConfig } from "~~/server/services/polar/client";
import type { BillingInvoicePreview } from "~~/server/services/polar/invoice-preview";

function mapPolarOrder(order: Order): BillingInvoicePreview {
    const created = order.createdAt instanceof Date
        ? Math.floor(order.createdAt.getTime() / 1000)
        : Math.floor(new Date(order.createdAt).getTime() / 1000);
    return {
        id: `polar:${order.id}`,
        number: order.invoiceNumber,
        status: order.status,
        currency: (order.currency || "usd").toLowerCase(),
        amountPaid: order.paid ? order.totalAmount : 0,
        amountDue: order.dueAmount,
        total: order.totalAmount,
        created,
        hostedInvoiceUrl: null,
        invoicePdf: null,
        customerId: order.customerId,
        provider: "polar",
    };
}

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const invoices: BillingInvoicePreview[] = [];
    const config = useRuntimeConfig(event);

    const { accessToken } = getPolarConfig(event);
    if (accessToken && (user.polarCustomerId || user.id)) {
        try {
            const polar = createPolarClient(event);
            const pages = await polar.orders.list({
                externalCustomerId: user.id,
                limit: 50,
                sorting: ["-created_at"],
            });
            for await (const page of pages) {
                for (const order of page.result.items) {
                    invoices.push(mapPolarOrder(order));
                }
            }
        } catch (error) {
            console.error("[Polar] Error fetching orders:", error);
        }
    }

    const stripeSecretKey = config.stripe.secretKey;
    if (stripeSecretKey && (user.stripeCustomerId || user.email)) {
        try {
            const stripe = new Stripe(stripeSecretKey);
            let stripeInvoices: Stripe.Invoice[] = [];
            if (user.stripeCustomerId) {
                const fetched = await stripe.invoices.list({
                    customer: user.stripeCustomerId,
                    limit: 50,
                });
                stripeInvoices = fetched.data;
            } else if (user.email) {
                const customers = await stripe.customers.list({
                    email: user.email,
                    limit: 100,
                });
                const invoicesByCustomer = await Promise.all(customers.data.map((customer) => stripe.invoices.list({
                    customer: customer.id,
                    limit: 50,
                })));
                const unique = new Map<string, Stripe.Invoice>();
                for (const invoice of invoicesByCustomer.flatMap((result) => result.data)) {
                    if (invoice.id) unique.set(invoice.id, invoice);
                }
                stripeInvoices = Array.from(unique.values());
            }

            for (const invoice of stripeInvoices) {
                if (!invoice.id) continue;
                invoices.push({
                    id: invoice.id,
                    number: invoice.number,
                    status: invoice.status,
                    currency: invoice.currency,
                    amountPaid: invoice.amount_paid,
                    amountDue: invoice.amount_due,
                    total: invoice.total,
                    created: invoice.created,
                    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
                    invoicePdf: invoice.invoice_pdf ?? null,
                    customerId: typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? null,
                    provider: "stripe",
                });
            }
        } catch (error) {
            console.error("[Stripe] Error fetching invoices:", error);
        }
    }

    return invoices.sort((a, b) => b.created - a.created).slice(0, 50);
});
