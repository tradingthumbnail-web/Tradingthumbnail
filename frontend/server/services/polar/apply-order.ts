import { and, eq, sql } from "drizzle-orm";
import type { Order } from "@polar-sh/sdk/models/components/order.js";
import type { Subscription } from "@polar-sh/sdk/models/components/subscription.js";

import { db } from "~~/server/database";
import { paymentTable } from "~~/server/database/schemas/payment.schema";
import { subscriptionTable, type SubscriptionStatus } from "~~/server/database/schemas/subscription.schema";
import { userTable, type Locale } from "~~/server/database/schemas/user.schema";
import { type Tier } from "~~/server/database/schemas/tier.schema";

import { sendPurchaseConfirmationEmail } from "~~/server/services/emails/purchase-confirmation";
import { sendSubscriptionActivationEmail } from "~~/server/services/emails/subscription-activation";
import { sendEmailForBillingCycle } from "~~/server/services/emails/successfull-billing-cycle";
import { log } from "~~/server/utils/logger";
import {
    findProductByPolarProductId,
    findTierByPolarProductId,
    getProductEntitlements,
    getTierSubscribeCredits,
} from "~~/server/services/polar/catalog";

export async function resolveUserFromPolarOrder(order: Order) {
    const metadataUserId = typeof order.metadata?.userId === "string" ? order.metadata.userId : null;
    const externalId = order.customer?.externalId ?? null;
    const polarCustomerId = order.customerId ?? order.customer?.id ?? null;

    if (metadataUserId && externalId && metadataUserId !== externalId) {
        throw createError({ statusCode: 400, statusMessage: "Polar customer does not match authenticated user" });
    }

    const userId = metadataUserId || externalId;
    if (userId) {
        const user = await db.query.userTable.findFirst({ where: eq(userTable.id, userId) });
        if (!user) {
            throw createError({ statusCode: 400, statusMessage: "User not found" });
        }
        return user;
    }

    if (polarCustomerId) {
        const user = await db.query.userTable.findFirst({
            where: eq(userTable.polarCustomerId, polarCustomerId),
        });
        if (user) return user;
    }

    throw createError({ statusCode: 400, statusMessage: "Unable to resolve Polar customer to a user" });
}

export async function resolveUserFromPolarSubscription(subscription: Subscription) {
    const metadataUserId = typeof subscription.metadata?.userId === "string" ? subscription.metadata.userId : null;
    const externalId = subscription.customer?.externalId ?? null;
    const polarCustomerId = subscription.customerId ?? subscription.customer?.id ?? null;

    if (metadataUserId && externalId && metadataUserId !== externalId) {
        throw createError({ statusCode: 400, statusMessage: "Polar customer does not match authenticated user" });
    }

    const userId = metadataUserId || externalId;
    if (userId) {
        const user = await db.query.userTable.findFirst({ where: eq(userTable.id, userId) });
        if (!user) {
            throw createError({ statusCode: 400, statusMessage: "User not found" });
        }
        return user;
    }

    if (polarCustomerId) {
        const user = await db.query.userTable.findFirst({
            where: eq(userTable.polarCustomerId, polarCustomerId),
        });
        if (user) return user;
    }

    throw createError({ statusCode: 400, statusMessage: "Unable to resolve Polar customer to a user" });
}

export async function upsertPolarSubscription({
    userId,
    polarCustomerId,
    polarSubscriptionId,
    tierId,
    status,
    startsAt,
    endsAt,
}: {
    userId: string;
    polarCustomerId?: string | null;
    polarSubscriptionId: string;
    tierId: number;
    status: SubscriptionStatus;
    startsAt: Date;
    endsAt: Date;
}) {
    const existing = await db.query.subscriptionTable.findFirst({
        where: eq(subscriptionTable.polarSubscriptionId, polarSubscriptionId),
    });

    if (existing && existing.userId && existing.userId !== userId) {
        throw createError({ statusCode: 403, statusMessage: "Polar subscription belongs to another user" });
    }

    if (existing) {
        await db.update(subscriptionTable).set({
            userId,
            tierId,
            status,
            startsAt,
            endsAt,
        }).where(eq(subscriptionTable.id, existing.id));
    } else {
        await db.insert(subscriptionTable).values({
            userId,
            tierId,
            polarSubscriptionId,
            status,
            startsAt,
            endsAt,
        });
    }

    if (polarCustomerId) {
        await db.update(userTable).set({
            polarCustomerId,
            updatedAt: new Date(),
        }).where(and(eq(userTable.id, userId)));
    }
}

export function mapPolarSubscriptionStatus(status: string | undefined, cancelAtPeriodEnd?: boolean): SubscriptionStatus {
    if (status === "past_due" || status === "unpaid") return "PAST_DUE";
    if (status === "canceled" || status === "incomplete_expired") return "CANCELLED";
    if (cancelAtPeriodEnd) return "CANCELLED";
    return "ACTIVE";
}

export async function applyPolarSubscriptionSnapshot(userId: string, subscription: Subscription, tier: Tier) {
    await upsertPolarSubscription({
        userId,
        polarCustomerId: subscription.customerId,
        polarSubscriptionId: subscription.id,
        tierId: tier.id,
        status: mapPolarSubscriptionStatus(subscription.status, subscription.cancelAtPeriodEnd),
        startsAt: new Date(subscription.currentPeriodStart),
        endsAt: new Date(subscription.currentPeriodEnd),
    });
}

/**
 * Fulfill a paid Polar order exactly once, using polar_order_id uniqueness.
 * Credits are granted only when the payment insert succeeds.
 */
export async function applyPaidPolarOrder(order: Order): Promise<{ granted: boolean; reason: string }> {
    const user = await resolveUserFromPolarOrder(order);
    const polarProductId = order.productId ?? order.product?.id ?? null;
    const billingReason = order.billingReason;
    const polarCustomerId = order.customerId ?? order.customer?.id ?? null;

    const existingPayment = await db.query.paymentTable.findFirst({
        where: eq(paymentTable.polarOrderId, order.id),
    });
    if (existingPayment) {
        return { granted: false, reason: "duplicate-order" };
    }

    const inserted = await db.insert(paymentTable).values({
        userId: user.id,
        polarOrderId: order.id,
        polarCheckoutId: order.checkoutId,
        amount: order.totalAmount,
        currency: (order.currency || "EUR").toUpperCase(),
        status: "SUCCESS",
        metadata: {
            billingReason,
            polarProductId,
            polarSubscriptionId: order.subscriptionId,
            polarCustomerId,
        },
    }).onConflictDoNothing().returning({ id: paymentTable.id });

    if (inserted.length === 0) {
        return { granted: false, reason: "duplicate-order" };
    }

    if (billingReason === "purchase") {
        const product = await findProductByPolarProductId(polarProductId);
        if (!product) {
            log.warn("Polar one-time order has no mapped product", { polarProductId, orderId: order.id });
            return { granted: false, reason: "unmapped-product" };
        }
        const entitlements = getProductEntitlements(product);
        if (entitlements.credits === 0 && entitlements.avatarCredits === 0) {
            log.warn("Polar product has no entitlements in metadata", { productId: product.id });
            return { granted: false, reason: "no-entitlements" };
        }
        await db.update(userTable).set({
            polarCustomerId: polarCustomerId ?? user.polarCustomerId,
            credit: sql`${userTable.credit} + ${entitlements.credits}`,
            avatarCredit: sql`${userTable.avatarCredit} + ${entitlements.avatarCredits}`,
            updatedAt: new Date(),
        }).where(eq(userTable.id, user.id));

        try {
            await sendPurchaseConfirmationEmail({
                email: user.email,
                username: user.username,
                productName: product.name,
                amount: order.totalAmount,
                currency: order.currency,
                userLocale: user.locale as Locale,
            });
        } catch (error) {
            log.error("Failed to send Polar purchase email", error, { userId: user.id });
        }
        return { granted: true, reason: "one-time" };
    }

    const tier = await findTierByPolarProductId(polarProductId);
    if (!tier) {
        log.warn("Polar subscription order has no mapped tier", { polarProductId, orderId: order.id });
        return { granted: false, reason: "unmapped-tier" };
    }

    if (order.subscriptionId) {
        await upsertPolarSubscription({
            userId: user.id,
            polarCustomerId,
            polarSubscriptionId: order.subscriptionId,
            tierId: tier.id,
            status: "ACTIVE",
            startsAt: order.createdAt ? new Date(order.createdAt) : new Date(),
            endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
    }

    if (billingReason === "subscription_create") {
        const entitlements = getTierSubscribeCredits(tier);
        await db.update(userTable).set({
            polarCustomerId: polarCustomerId ?? user.polarCustomerId,
            credit: sql`${userTable.credit} + ${entitlements.credits}`,
            avatarCredit: sql`${userTable.avatarCredit} + ${entitlements.avatarCredits}`,
            updatedAt: new Date(),
        }).where(eq(userTable.id, user.id));

        try {
            await sendSubscriptionActivationEmail(user.email, user.username, user.locale as Locale);
        } catch (error) {
            log.error("Failed to send Polar activation email", error, { userId: user.id });
        }
        return { granted: true, reason: "subscription-create" };
    }

    if (billingReason === "subscription_cycle") {
        await db.update(userTable).set({
            polarCustomerId: polarCustomerId ?? user.polarCustomerId,
            credit: tier.features.maxCredits,
            updatedAt: new Date(),
        }).where(eq(userTable.id, user.id));

        try {
            await sendEmailForBillingCycle({
                email: user.email,
                username: user.username,
                invoiceURL: "",
                userLocale: user.locale as Locale,
            });
        } catch (error) {
            log.error("Failed to send Polar renewal email", error, { userId: user.id });
        }
        return { granted: true, reason: "subscription-cycle" };
    }

    return { granted: false, reason: `unhandled-billing-reason:${billingReason}` };
}

export async function applyPolarPastDue(polarSubscriptionId: string) {
    const subscription = await db.query.subscriptionTable.findFirst({
        where: eq(subscriptionTable.polarSubscriptionId, polarSubscriptionId),
    });
    if (!subscription) return { status: "not-found" as const };
    if (subscription.status === "CANCELLED") return { status: "already-cancelled" as const, userId: subscription.userId };
    if (subscription.status === "PAST_DUE") return { status: "already-past-due" as const, userId: subscription.userId };

    if (subscription.status === "ACTIVE") {
        await db.update(subscriptionTable)
            .set({ status: "PAST_DUE" })
            .where(eq(subscriptionTable.id, subscription.id));
        return { status: "updated" as const, userId: subscription.userId };
    }
    return { status: "ignored" as const, userId: subscription.userId };
}

export async function applyPolarCancellation(polarSubscriptionId: string) {
    const subscription = await db.query.subscriptionTable.findFirst({
        where: eq(subscriptionTable.polarSubscriptionId, polarSubscriptionId),
    });
    if (!subscription?.userId) return { status: "not-found" as const, userId: null };
    if (subscription.status === "CANCELLED") {
        return { status: "already-cancelled" as const, userId: subscription.userId };
    }
    await db.update(subscriptionTable)
        .set({ status: "CANCELLED" })
        .where(eq(subscriptionTable.id, subscription.id));
    return { status: "updated" as const, userId: subscription.userId };
}
