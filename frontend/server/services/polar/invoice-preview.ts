export type BillingInvoicePreview = {
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
    provider: "polar" | "stripe";
};
