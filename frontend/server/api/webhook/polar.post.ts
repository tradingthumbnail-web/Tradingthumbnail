import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import type { Order } from "@polar-sh/sdk/models/components/order.js";
import type { Subscription } from "@polar-sh/sdk/models/components/subscription.js";

import { getPolarConfig } from "~~/server/services/polar/client";
import {
    applyPaidPolarOrder,
    applyPolarCancellation,
    applyPolarPastDue,
    applyPolarSubscriptionSnapshot,
    resolveUserFromPolarSubscription,
} from "~~/server/services/polar/apply-order";
import { findTierByPolarProductId } from "~~/server/services/polar/catalog";
import { sendPaymentFailedToDueEmail } from "~~/server/services/emails/payment-failed-to-due";
import { sendSubscriptionCancellationEmail } from "~~/server/services/emails/subscription-cancellation";
import { db } from "~~/server/database";
import { eq } from "drizzle-orm";
import { userTable, type Locale } from "~~/server/database/schemas/user.schema";
import { log } from "~~/server/utils/logger";

function webhookHeaders(event: { headers: { get: (name: string) => string | null } }): Record<string, string> {
    return {
        "webhook-id": event.headers.get("webhook-id") ?? "",
        "webhook-timestamp": event.headers.get("webhook-timestamp") ?? "",
        "webhook-signature": event.headers.get("webhook-signature") ?? "",
    };
}

async function syncSubscriptionRecord(subscription: Subscription) {
    const user = await resolveUserFromPolarSubscription(subscription);
    const tier = await findTierByPolarProductId(subscription.productId);
    if (!tier) {
        log.warn("Polar subscription product is not mapped to a tier", {
            polarProductId: subscription.productId,
            polarSubscriptionId: subscription.id,
        });
        return;
    }
    await applyPolarSubscriptionSnapshot(user.id, subscription, tier);
}

export default defineEventHandler(async (event) => {
    const body = await readRawBody(event, "utf-8");
    if (!body) {
        throw createError({ statusCode: 400, statusMessage: "No body in the webhook request" });
    }

    const { webhookSecret } = getPolarConfig(event);
    if (!webhookSecret) {
        throw createError({ statusCode: 503, statusMessage: "Polar webhook secret not found" });
    }

    let payload: ReturnType<typeof validateEvent>;
    try {
        payload = validateEvent(body, webhookHeaders(event), webhookSecret);
    } catch (error) {
        if (error instanceof WebhookVerificationError) {
            throw createError({ statusCode: 403, statusMessage: "Invalid Polar webhook signature" });
        }
        throw createError({ statusCode: 400, statusMessage: "Error verifying Polar webhook" });
    }

    try {
        switch (payload.type) {
            case "order.paid": {
                await applyPaidPolarOrder(payload.data as Order);
                break;
            }
            case "subscription.created":
            case "subscription.active":
            case "subscription.updated":
            case "subscription.uncanceled": {
                await syncSubscriptionRecord(payload.data as Subscription);
                break;
            }
            case "subscription.cycled": {
                await syncSubscriptionRecord(payload.data as Subscription);
                break;
            }
            case "subscription.past_due": {
                const subscription = payload.data as Subscription;
                await syncSubscriptionRecord(subscription);
                const result = await applyPolarPastDue(subscription.id);
                if (result.status === "updated" && result.userId) {
                    const user = await db.query.userTable.findFirst({
                        where: eq(userTable.id, result.userId),
                    });
                    if (user) {
                        try {
                            await sendPaymentFailedToDueEmail(user.email, user.username, user.locale as Locale);
                        } catch (error) {
                            log.warn("Failed to send Polar past-due email", { error });
                        }
                    }
                }
                break;
            }
            case "subscription.canceled":
            case "subscription.revoked": {
                const subscription = payload.data as Subscription;
                const result = await applyPolarCancellation(subscription.id);
                if (result.status === "updated" && result.userId) {
                    const user = await db.query.userTable.findFirst({
                        where: eq(userTable.id, result.userId),
                    });
                    if (user) {
                        try {
                            await sendSubscriptionCancellationEmail(user.email, user.username, user.locale as Locale);
                        } catch (error) {
                            log.warn("Failed to send Polar cancellation email", { error });
                        }
                    }
                }
                break;
            }
            default:
                log.info("Unhandled Polar webhook event", { eventType: payload.type });
                break;
        }
    } catch (error) {
        if (error && typeof error === "object" && "statusCode" in error) {
            throw error;
        }
        log.error("Error processing Polar webhook", error, { eventType: payload.type });
        throw createError({ statusCode: 500, statusMessage: "Error processing Polar webhook" });
    }

    event.node.res.statusCode = 202;
    return { received: true };
});
