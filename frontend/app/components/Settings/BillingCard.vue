<template>
    <div class="card bg-base-100 shadow-md rounded-box">
        <div class="card-body p-6">
            <div v-if="error" role="alert" class="alert alert-error mt-4">
                <span>{{ $t('billing.errors.unableToLoadInvoices') }}</span>
            </div>

            <div v-else-if="pending" class="mt-4 space-y-3">
                <div class="skeleton h-12 w-full"></div>
                <div class="skeleton h-12 w-full"></div>
                <div class="skeleton h-12 w-full"></div>
            </div>

            <div v-else-if="!hasInvoices" class="mt-4 text-base-content/70 text-sm">
                {{ $t('billing.noInvoices') }}
            </div>

            <div v-else class="mt-4 overflow-x-auto">
                <table class="table">
                    <thead>
                        <tr>
                            <th>{{ $t('billing.id') }}</th>
                            <th class="text-right">{{ $t('billing.amount') }}</th>
                            <th>{{ $t('billing.currency') }}</th>
                            <th>{{ $t('billing.status') }}</th>
                            <th>{{ $t('billing.date') }}</th>
                            <th class="text-right">{{ $t('billing.actions') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="invoice in displayedInvoices" :key="invoice.id" class="hover align-top">
                            <td class="font-medium">#{{ invoice.number || invoice.id }}</td>
                            <td class="text-right">{{ formatAmount(invoice.total, invoice.currency) }}</td>
                            <td class="uppercase">{{ invoice.currency }}</td>
                            <td>
                                <span :class="['badge', statusClass(invoice.status)]">{{ invoice.status || '-' }}</span>
                            </td>
                            <td>{{ formatDate(invoice.created) }}</td>
                            <td class="text-right">
                                <div class="join justify-end">
                                    <button class="btn btn-secondary btn-xs join-item" @click="openInvoice(invoice)">
                                        <Icon name="lucide:download" size="16" mode="svg" />
                                        <span>{{ $t('settings.downloadInvoice') }}</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
const toast = useToast();

type StripeInvoice = {
    id: string;
    number: string | null;
    status: string | null;
    total: number;
    currency: string;
    created: number;
    hostedInvoiceUrl: string | null;
    invoicePdf: string | null;
};

const props = defineProps<{
    invoices?: unknown;
    payments?: unknown;
    pending?: boolean;
    error?: any;
    maxItems?: number;
}>();

const sourceInvoices = computed(() => {
    if (Array.isArray(props.invoices)) return props.invoices;
    if (Array.isArray(props.payments)) return props.payments;
    return [];
});

const normalized = computed<StripeInvoice[]>(() => {
    return sourceInvoices.value.map((invoice: any) => ({
        id: String(invoice.id),
        number: invoice.number ?? null,
        status: invoice.status ?? null,
        total: Number(invoice.total ?? invoice.amount ?? 0),
        currency: String(invoice.currency ?? 'USD').toUpperCase(),
        created: Number(invoice.created ?? 0),
        hostedInvoiceUrl: invoice.hostedInvoiceUrl ?? invoice.hosted_invoice_url ?? null,
        invoicePdf: invoice.invoicePdf ?? invoice.invoice_pdf ?? null,
    }));
});

const displayedInvoices = computed(() => {
    if (!props.maxItems || props.maxItems <= 0) return normalized.value;
    return normalized.value.slice(0, props.maxItems);
});

const hasInvoices = computed(() => displayedInvoices.value.length > 0);

function formatDate(timestamp: number | null) {
    if (!timestamp) return '-';
    try {
        return new Date(timestamp * 1000).toLocaleString();
    } catch {
        return '-';
    }
}

function formatAmount(amountCents: number | null, currency: string | null) {
    const amount = (amountCents ?? 0) / 100;
    const curr = (currency ?? 'USD').toUpperCase();
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: curr }).format(amount);
    } catch {
        return `${amount.toFixed(2)} ${curr}`;
    }
}

function statusClass(status: string | null) {
    switch (status) {
        case 'paid':
            return 'badge-success';
        case 'open':
        case 'draft':
            return 'badge-info';
        case 'void':
        case 'uncollectible':
            return 'badge-error';
        default:
            return 'badge-neutral';
    }
}

async function openInvoice(invoice: StripeInvoice) {
    const invoiceUrl = invoice.invoicePdf || invoice.hostedInvoiceUrl;
    if (invoiceUrl) {
        window.open(invoiceUrl, '_blank');
        return;
    }
    try {
        const { invoiceUrl: fetchedUrl } = await $fetch<{ invoiceUrl: string }>(
            `/api/v1/billing/invoices/${encodeURIComponent(invoice.id)}/download`,
        );
        if (!fetchedUrl) throw new Error('missing invoice url');
        window.open(fetchedUrl, '_blank');
    } catch (error) {
        console.error(error);
        toast.show({
            title: t('common.errors.title'),
            message: t('common.errors.unableToDownloadInvoice', { invoiceId: invoice.number || invoice.id }),
            status: 'error',
        });
    }
}
</script>

<style scoped>

</style>