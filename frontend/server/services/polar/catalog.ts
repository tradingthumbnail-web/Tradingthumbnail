import { eq } from "drizzle-orm";

import { db } from "~~/server/database";
import { productTable, type Product, type ProductMetadata } from "~~/server/database/schemas/product.schema";
import { tierTable, type Tier } from "~~/server/database/schemas/tier.schema";

export type PolarCatalogPrice = {
    id: string;
    currency: string;
    unit_amount: number | null;
    recurring?: { interval: "month" | "year"; interval_count: number | null } | null;
};

export function getPolarProductIdForInterval(tier: Tier, interval: "month" | "year"): string | null {
    if (interval === "year") {
        return tier.polarYearlyProductId ?? null;
    }
    return tier.polarProductId ?? null;
}

export async function findTierByPolarProductId(polarProductId: string | null | undefined): Promise<Tier | null> {
    if (!polarProductId) return null;
    const byMonthly = await db.query.tierTable.findFirst({
        where: eq(tierTable.polarProductId, polarProductId),
    });
    if (byMonthly) return byMonthly;
    const byYearly = await db.query.tierTable.findFirst({
        where: eq(tierTable.polarYearlyProductId, polarProductId),
    });
    return byYearly ?? null;
}

export async function findProductByPolarProductId(polarProductId: string | null | undefined): Promise<Product | null> {
    if (!polarProductId) return null;
    const product = await db.query.productTable.findFirst({
        where: eq(productTable.polarProductId, polarProductId),
    });
    return product ?? null;
}

export function getProductEntitlements(product: Product): { credits: number; avatarCredits: number } {
    const metadata = (product.metadata ?? {}) as ProductMetadata;
    const credits = Number(metadata.credits ?? 0);
    const avatarCredits = Number(metadata.avatarCredits ?? 0);
    return {
        credits: Number.isFinite(credits) && credits > 0 ? Math.floor(credits) : 0,
        avatarCredits: Number.isFinite(avatarCredits) && avatarCredits > 0 ? Math.floor(avatarCredits) : 0,
    };
}

export function getTierSubscribeCredits(tier: Tier): { credits: number; avatarCredits: number } {
    return {
        credits: tier.features?.maxCredits ?? 0,
        avatarCredits: 1,
    };
}

export function isPolarSubscription(subscription: { polarSubscriptionId?: string | null; stripeSubscriptionId?: string | null }): boolean {
    return Boolean(subscription.polarSubscriptionId);
}
