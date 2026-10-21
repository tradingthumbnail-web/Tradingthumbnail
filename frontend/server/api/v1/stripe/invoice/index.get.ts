import Stripe from 'stripe';

type InvoicePreview = {
    id: string;
    number: string | null;
    status: string | null;
    currency: string;
    amountPaid: number;
    amountDue: number;
    total: number;
    created: number;
    hostedInvoiceUrl: string | null;
    invoicePdf: string | null;
    customerId: string | null;
};

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const config = useRuntimeConfig(event);
    const stripeSecretKey = config.stripe.secretKey;
    if (!stripeSecretKey) {
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }

    const stripe = new Stripe(stripeSecretKey);

    let invoices: Stripe.Invoice[] = [];
    
    try {
        if (user.stripeCustomerId) {
            const fetchedInvoices = await stripe.invoices.list({
                customer: user.stripeCustomerId,
                limit: 50,
            });
            invoices = fetchedInvoices.data;
        } else if (user.email) {
            const customers = await stripe.customers.list({
                email: user.email,
                limit: 100,
            });

            const invoicesByCustomer = await Promise.all(customers.data.map(customer => stripe.invoices.list({
                customer: customer.id,
                limit: 50,
            })));

            const allInvoices = invoicesByCustomer.flatMap(result => result.data);
            const uniqueInvoices = new Map<string, Stripe.Invoice>();
            for (const invoice of allInvoices) {
                if (invoice.id) {
                    uniqueInvoices.set(invoice.id, invoice);
                }
            }

            invoices = Array
                .from(uniqueInvoices.values())
                .sort((a, b) => b.created - a.created)
                .slice(0, 50);
        }

        const invoicePreviews: InvoicePreview[] = invoices
            .filter((invoice) => Boolean(invoice.id))
            .map((invoice) => ({
            id: invoice.id as string,
            number: invoice.number,
            status: invoice.status,
            currency: invoice.currency,
            amountPaid: invoice.amount_paid,
            amountDue: invoice.amount_due,
            total: invoice.total,
            created: invoice.created,
            hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
            invoicePdf: invoice.invoice_pdf ?? null,
            customerId: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? null,
        }));

        return invoicePreviews.sort((a, b) => b.created - a.created).slice(0, 50);
    } catch (error: any) {
        console.error('[Stripe] Error fetching invoices:', error);
        if (error.statusCode) {
            throw error;
        }
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});