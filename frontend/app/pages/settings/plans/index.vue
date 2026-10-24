<template>
    <div class="min-h-[60vh] px-4 sm:px-6 lg:px-8 py-8">
        <div class="max-w-3xl mx-auto text-center mb-8">
            <h1 class="text-2xl sm:text-3xl font-semibold text-base-content">{{ $t('plans.title') }}</h1>
            <p class="mt-2 text-base-content/70">{{ $t('plans.description') }}</p>
            <p v-if="!paymentsEnabled" class="mt-3 text-sm text-warning">Payments are temporarily disabled.</p>
        </div>

        <div class="flex items-center justify-center mb-6">
            <div class="join bg-base-100 rounded">
                <button type="button" class="btn btn-sm join-item"
                    :class="billingInterval === 'month' ? 'btn-primary' : 'btn-ghost'"
                    @click="billingInterval = 'month'">{{ $t('plans.monthly') }}</button>
                <button type="button" class="btn btn-sm join-item"
                    :class="billingInterval === 'year' ? 'btn-primary' : 'btn-ghost'"
                    @click="billingInterval = 'year'">{{ $t('plans.yearly') }}</button>
            </div>
        </div>


        <div v-if="pending" class="max-w-3xl mx-auto">
            <div class="card card-side bg-base-100 shadow-sm mb-4 animate-pulse">
                <figure class="w-24 sm:w-32 bg-base-200" />
                <div class="card-body">
                    <div class="h-5 w-40 bg-base-200 rounded" />
                    <div class="h-4 w-64 bg-base-200 rounded" />
                </div>
            </div>
            <div class="card card-side bg-base-100 shadow-sm mb-4 animate-pulse">
                <figure class="w-24 sm:w-32 bg-base-200" />
                <div class="card-body">
                    <div class="h-5 w-40 bg-base-200 rounded" />
                    <div class="h-4 w-64 bg-base-200 rounded" />
                </div>
            </div>
        </div>

        <div v-else-if="error" class="max-w-3xl mx-auto">
            <div class="alert alert-error">
                <span>{{ $t('plans.errors.unableToLoadPlans') }}</span>
            </div>
        </div>

        <div v-else class="max-w-3xl mx-auto">
            <div v-for="(tier, index) in data" :key="tier.tier.id"
                class="card card-side bg-base-100 shadow-sm mb-4 border border-base-200">
                <figure class="w-64 bg-base-200 flex items-center justify-center">
                    <img :src="`/img/tier/${index}.png`" alt="Tier image" class="w-full h-full object-cover hover:scale-105 transition-all duration-300" />
                </figure>
                <div class="card-body">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <h2 class="card-title text-base-content">{{ tier.tier.name }}</h2>
                            <p class="text-sm text-base-content/70 mt-1">{{ tier.tier.description }}</p>
                        </div>
                        <div class="text-right shrink-0">
                            <div class="text-2xl font-semibold text-base-content">
                                {{ formatUnitAmount(getPriceByInterval(tier.prices, billingInterval)) }}
                            </div>
                            <div class="text-xs text-base-content/60">per {{ billingInterval }}</div>
                            <div v-if="billingInterval === 'year' && hasBothIntervals(tier.prices)"
                                class="badge badge-success badge-sm mt-1">Save {{
                                computeYearlySavingsPercent(tier.prices) }}%</div>
                        </div>
                    </div>

                    <div class="mt-3">
                        <div class="text-xs uppercase tracking-wide text-base-content/50 mb-1">{{ $t('plans.whatIsIncluded') }}</div>
                        <ul class="text-sm text-base-content/80 grid grid-cols-1 sm:grid-cols-2 gap-y-2" v-if="tier.tier.features.features && tier.tier.features.features?.[locale as Locale]">
                        <li v-for="feature in tier.tier.features.features?.[locale as Locale]" :key="feature" class="flex items-center gap-2"><span
                                    class="i-lucide-check-circle-2 text-success"></span>
                                    {{ feature }}
                            </li>
                        </ul>
                    </div>

                    <div class="card-actions justify-end mt-4">
                        <button class="btn btn-primary" :disabled="!paymentsEnabled" @click="createCheckoutSession({
                            productId: tier.tier.stripeProductId as string,
                            tierId: tier.tier.id,
                        })">{{ $t('plans.choose') }} {{ tier.tier.name }}</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

</template>

<script setup lang="ts">
import { clicklabPageTitle } from '~~/shared/clicklab/page-title';
import type { Tier } from '~~/server/database/schemas/tier.schema';
import type { Locale } from '~~/server/database/schemas/user.schema';

const toast = useToast();
const { locale, t } = useI18n();
const config = useRuntimeConfig();
const paymentsEnabled = computed(() => String(config.public.enablePayments).toLowerCase() === 'true');

type StripeRecurring = {
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count: number | null;
};

type StripePrice = {
    id: string;
    currency: string; // e.g. 'eur'
    unit_amount: number | null; // in minor units
    recurring?: StripeRecurring | null;
};

type TierWithPrices = {
    tier: Tier;
    prices: StripePrice[];
};

const { data, pending, error } = await useFetch<TierWithPrices[]>('/api/v1/tier');

function getPriceByInterval(prices: StripePrice[] | undefined, interval: 'month' | 'year'): StripePrice | undefined {
    return (prices ?? []).find(p => p.recurring?.interval === interval);
}

function formatUnitAmount(price?: StripePrice): string {
    if (!price || price.unit_amount == null) return '—';
    const currency = (price.currency || 'usd').toUpperCase();
    const amount = price.unit_amount / 100; // Stripe amounts are in minor units
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
    } catch {
        return `${amount.toFixed(2)} ${currency}`;
    }
}

const billingInterval = ref<'month' | 'year'>('month');

function hasBothIntervals(prices: StripePrice[] | undefined): boolean {
    if (!prices) return false;
    return Boolean(getPriceByInterval(prices, 'month') && getPriceByInterval(prices, 'year'));
}

function computeYearlySavingsPercent(prices: StripePrice[] | undefined): number {
    const monthly = getPriceByInterval(prices, 'month');
    const yearly = getPriceByInterval(prices, 'year');
    if (!monthly?.unit_amount || !yearly?.unit_amount) return 0;
    const fullYearAtMonthly = monthly.unit_amount * 12;
    const savings = fullYearAtMonthly - yearly.unit_amount;
    const pct = (savings / fullYearAtMonthly) * 100;
    return Math.max(0, Math.round(pct));
};

const createCheckoutSession = async ({
    productId,
    tierId,
}: {
    productId: string,
    tierId: number,
}) => {
    if (!paymentsEnabled.value) {
        toast.show({
            title: 'Payments disabled',
            message: 'Payments are temporarily disabled.',
            status: 'warning',
        });
        return;
    }

    // Check if the yearly flag is set
    const yearly = billingInterval.value === 'year';
    const selectedTier = data.value?.find(t => t.tier.id === tierId);
    if (!selectedTier) {
        toast.show({
            title: 'Error',
            message: t('plans.errors.tierNotFound'),
            status: 'error',
        });
        return;
    }
    const prices = selectedTier.prices;
    const priceByInterval = getPriceByInterval(prices, yearly ? 'year' : 'month');
    if (!priceByInterval) {
        toast.show({
            title: 'Error',
            message: t('plans.errors.priceNotFound'),
            status: 'error',
        });
        return;
    }
    const priceId = priceByInterval.id;

    try {
        const { checkoutUrl } = await $fetch('/api/v1/polar/checkout-session', {
            method: 'POST',
            body: {
                productId,
                priceId,
                tierId,
                interval: yearly ? 'year' : 'month',
            },
        });
        if (checkoutUrl) {
            window.location.href = checkoutUrl;
        }
    } catch (error) {
        console.error(error);
        toast.show({
            title: 'Error',
            message: t('plans.errors.failedToCreateCheckoutSession'),
            status: 'error',
        });
    }
};

useHead({
    title: clicklabPageTitle(t('plans.title')),
});
</script>

<style scoped></style>