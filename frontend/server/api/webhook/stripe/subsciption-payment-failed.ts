import { desc, eq } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "~~/server/database";

import { subscriptionTable, type SubscriptionStatus } from "~~/server/database/schemas/subscription.schema";
import { Locale, userTable } from "~~/server/database/schemas/user.schema";

import { sendPaymentFailedToDueEmail } from "~~/server/services/emails/payment-failed-to-due";
import { sendPaymentFailedToCancelledEmail } from "~~/server/services/emails/payment-failed-to-cancel";

export default defineEventHandler(async (event) => {
    let stripeEvent: Stripe.Event | null = null;
    const body = await readRawBody(event, "utf-8");

    if (!body) {
        throw createError({
            statusCode: 400,
            statusMessage: "No body in the webhook request"
        });
    }

    // Verify the webhook
    const signature = event.headers.get("stripe-signature");
    if (!signature) {
        throw createError({
            statusCode: 400,
            statusMessage: "No signature"
        });
    };

    // Stripe object
    const config = useRuntimeConfig(event);
    if (!config.stripe.secretKey) {
        throw createError({
            statusCode: 500,
            statusMessage: "Stripe secret key not found"
        });
    }
    const stripe = new Stripe(config.stripe.secretKey as string);
    const endpointSecret = config.stripe.webhookSecret.paymentFailed as string;
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

    // Select the type of event
    try {
        switch (stripeEvent.type) {
            case "invoice.payment_failed":
                // Get the user email from the invoice
                const userEmail = (stripeEvent.data.object as Stripe.Invoice).customer_email;
                if (!userEmail) {
                    throw createError({
                        statusCode: 400,
                        statusMessage: "No customer email"
                    });
                };

                // 1. Get the user and the subscription object
                const user = await db.query.userTable.findFirst({
                    where: eq(userTable.email, userEmail),
                    with: {
                        subscriptions: {
                            orderBy: desc(subscriptionTable.createdAt),
                            limit: 1,
                        }
                    }
                });
                if (!user) {
                    throw createError({
                        statusCode: 400,
                        statusMessage: "User not found"
                    });
                };

                // 2. Get the subscription and check which status it has
                const subscription = user.subscriptions?.[0];
                if (!subscription) {
                    // 2.1. If no subscription is found, return an error
                    throw createError({
                        statusCode: 400,
                        statusMessage: "No subscription found"
                    });
                };
                const subscriptionStatus = subscription.status as SubscriptionStatus;

                // 3. Update the status of the subscription depending on the previous status
                switch (subscriptionStatus) {
                    // 3.1. If the subscription was active, set it to past due
                    case "ACTIVE":
                        // 3.1.1. Update the status to past due
                        await db.update(subscriptionTable).set({
                            status: "PAST_DUE"
                        }).where(eq(subscriptionTable.id, subscription.id));

                        // 3.1.2. Send an email to inform the user - it should not fail the webhook
                        try {
                            await sendPaymentFailedToDueEmail(userEmail, user.username, user.locale as Locale);
                        } catch (error) {
                            console.warn("Error sending payment failed to due email for subscription", subscription.id, error);
                        }
                        break;

                    // 3.2. If it was already past due, cancel the subscription
                    case "PAST_DUE":
                        // 3.2.1. Update the status to cancelled
                        await db.update(subscriptionTable).set({
                            status: "CANCELLED"
                        }).where(eq(subscriptionTable.id, subscription.id));

                        // 3.2.2. Send an email to inform the user - it should not fail the webhook
                        try {
                            await sendPaymentFailedToCancelledEmail(userEmail, user.username, user.locale as Locale);
                        } catch (error) {
                            console.warn("Error sending payment failed to cancelled email for subscription", subscription.id, error);
                        }
                        break;

                    // 3.3. If it is any different, just return and don't send anything
                    default:
                        break;
                }
                break;
            default:
                console.error("Unhandled event type", stripeEvent.type);
                break;
        }
    
        console.log("--- Subscription payment failed webhook processed successfully");
        return {
            statusCode: 200,
            statusMessage: "Webhook received"
        };
    } catch (error) {
        console.error("Error processing webhook", error);
        throw createError({
            statusCode: 500,
            statusMessage: "Error processing webhook"
        });
    }
});