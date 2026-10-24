import Stripe from "stripe";
import { Polar } from "@polar-sh/sdk";
import { asc } from "drizzle-orm";

import { db } from "~~/server/database";
import { Tier, tierTable } from "~~/server/database/schemas/tier.schema";
import { createPolarClient, getPolarConfig } from "~~/server/services/polar/client";
import type { PolarCatalogPrice } from "~~/server/services/polar/catalog";
import { isPaymentsEnabled } from "~~/server/utils/payments";

function mapPolarProductToPrices(product: {
    recurringInterval?: string | null;
    prices?: Array<{
        id: string;
        amountType?: string;
        priceAmount?: number;
        priceCurrency?: string;
        isArchived?: boolean;
    }>;
}, interval: "month" | "year"): PolarCatalogPrice[] {
    const prices = (product.prices ?? []).filter((price) => !price.isArchived && price.amountType === "fixed");
    return prices.map((price) => ({
        id: price.id,
        currency: price.priceCurrency || "usd",
        unit_amount: price.priceAmount ?? null,
        recurring: { interval, interval_count: 1 },
    }));
}

async function loadPolarPrices(polar: Polar, productId: string | null | undefined, interval: "month" | "year"): Promise<PolarCatalogPrice[]> {
    if (!productId) return [];
    const product = await polar.products.get({ id: productId });
    return mapPolarProductToPrices(product, interval);
}

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const config = useRuntimeConfig(event);
    const stripeSecretKey = config.stripe.secretKey;
    const { accessToken } = getPolarConfig(event);

    try {
        const tiers = await db.query.tierTable.findMany({
            orderBy: asc(tierTable.price),
        });

        if (!isPaymentsEnabled(event)) {
            return tiers.map((tier) => ({
                tier,
                prices: [] as PolarCatalogPrice[] | Stripe.Price[],
            }));
        }

        const polar = accessToken ? createPolarClient(event) : null;
        const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

        const tierPrices: {
            tier: Tier;
            prices: PolarCatalogPrice[] | Stripe.Price[];
        }[] = [];

        for (const tier of tiers) {
            let prices: PolarCatalogPrice[] | Stripe.Price[] = [];

            if (polar && (tier.polarProductId || tier.polarYearlyProductId)) {
                try {
                    const monthly = await loadPolarPrices(polar, tier.polarProductId, "month");
                    const yearly = await loadPolarPrices(polar, tier.polarYearlyProductId, "year");
                    prices = [...monthly, ...yearly];
                } catch (error) {
                    console.error("Polar catalog lookup failed for tier", tier.id, error);
                }
            }
            if (prices.length === 0 && stripe && tier.stripeProductId) {
                const listed = await stripe.prices.list({
                    product: tier.stripeProductId,
                });
                prices = listed.data;
            }

            if (prices.length === 0 && !tier.polarProductId && !tier.stripeProductId) {
                continue;
            }

            tierPrices.push({
                tier,
                prices,
            });
        }

        return tierPrices;
    } catch (error) {
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});
