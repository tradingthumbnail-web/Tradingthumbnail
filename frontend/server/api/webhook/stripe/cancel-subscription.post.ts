import Stripe from "stripe";

import { eq } from "drizzle-orm";

import { db } from "~~/server/database";
import { userTable, type Locale } from "~~/server/database/schemas/user.schema";

import { sendSubscriptionCancellationEmail } from "~~/server/services/emails/subscription-cancellation";
import { applyVerifiedSubscriptionCancellation } from "~~/server/services/stripe/apply-subscription-cancellation";

export default defineEventHandler(async (event) => {
    // Recieve webhook
    let stripeEvent: Stripe.Event | null = null;
    console.log("--- Receiving webhook for a completed checkout session")
    const body = await readRawBody(event, "utf-8");

    if (!body) {
        throw createError({
            statusCode: 400,
            statusMessage: "No body in the webhook request"
        });
    }

    // Verify the webhook
    const signature = event.headers.get("stripe-signature");
    console.log(" |- Validating signature for a canceled subscription")
    if (!signature) {
        throw createError({
            statusCode: 400,
            statusMessage: "No signature"
        });
    };

    // Stripe object
    const config = useRuntimeConfig(event);
    const stripeSecretKey = config.stripe.secretKey;
    const stripeWebhookSecret = config.stripe.webhookSecret.cancelSubscription;
    if (!stripeSecretKey) {
        throw createError({
            statusCode: 500,
            statusMessage: "Stripe secret key not found"
        });
    };
    const stripe = new Stripe(stripeSecretKey);
    const endpointSecret = stripeWebhookSecret;
    if (!endpointSecret) {
        throw createError({
            statusCode: 500,
            statusMessage: "Stripe webhook secret not found"
        });
    }
    try {
        stripeEvent = stripe.webhooks.constructEvent(
            body,
            signature,
            endpointSecret
        )
    } catch (error) {
        console.error("Error verifying webhook", error);
        throw createError({
            statusCode: 400,
            statusMessage: "Error verifying webhook"
        });
    };

    console.log(" |- Canceled subscription webhook data");
    if (stripeEvent.type !== "customer.subscription.deleted") {
        return {
            statusCode: 200,
            statusMessage: "Ignored event type",
        };
    }

    const subscriptionId = (stripeEvent.data.object as Stripe.Subscription).id;
    if (!subscriptionId) {
        throw createError({
            statusCode: 400,
            statusMessage: "No subscription id"
        });
    };

    const result = await applyVerifiedSubscriptionCancellation(subscriptionId);
    if (result.status === "not-found") {
        console.error("Subscription not found in the database", subscriptionId);
        return {
            statusCode: 200,
            statusMessage: "Subscription not found in the database"
        };
    }

    const user = await db.query.userTable.findFirst({
        where: eq(userTable.id, result.userId as string)
    });
    if (!user) {
        throw createError({
            statusCode: 400,
            statusMessage: "User not found in the database"
        });
    };

    if (result.status === "updated") {
        try {
            await sendSubscriptionCancellationEmail(user.email as string, user.username as string, user.locale as Locale);
            console.log(" |- Cancelation email sent to user", user.username);
        } catch (error) {
            console.warn("Error sending cancelation email", error);
        }
    }

    return {
        statusCode: 200,
        statusMessage: "Webhook received"
    };
});