import Stripe from "stripe";

import { db } from "~~/server/database";
import { Locale, userTable } from "~~/server/database/schemas/user.schema";
import { and, desc, eq } from "drizzle-orm";
import { subscriptionTable } from "~~/server/database/schemas/subscription.schema";

import { sendEmailForBillingCycle } from "~~/server/services/emails/successfull-billing-cycle";
import { paymentTable } from "~~/server/database/schemas/payment.schema";

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
    const endpointSecret = config.stripe.webhookSecret.billingCycle as string;
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
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        switch (stripeEvent.type) {
            case "invoice.payment_succeeded":
                // Update the credits and everything from the user
                const billingReason = invoice.billing_reason;
                if (billingReason === "subscription_cycle") {
                    if (!invoice.id) {
                        throw createError({
                            statusCode: 400,
                            statusMessage: "Missing invoice id"
                        });
                    }
                    const userEmail = invoice.customer_email;
                    if (!userEmail) {
                        throw createError({
                            statusCode: 400,
                            statusMessage: "No customer email"
                        });
                    };

                    // 1. Fetch the user from the database
                    const user = await db.query.userTable.findFirst({
                        where: eq(userTable.email, userEmail),
                        with: {
                            subscriptions: {
                                where: eq(subscriptionTable.status, "ACTIVE"),
                                orderBy: desc(subscriptionTable.createdAt),
                                limit: 1,
                                with: {
                                    tier: true,
                                }
                            }
                        }
                    });
                    if (!user) {
                        throw createError({
                            statusCode: 400,
                            statusMessage: "User not found"
                        });
                    };

                    // 2. Check the subscription of the user
                    const subscription = user.subscriptions?.[0];
                    const tier = subscription?.tier;
                    if (!subscription || !tier) {
                        throw createError({
                            statusCode: 400,
                            statusMessage: "No active subscription or tier found for this user"
                        });
                    };

                    // 3. Ensure idempotent billing cycle handling by inserting payment first.
                    const stripePaymentIntent = invoice.payments?.data?.[0]?.payment?.payment_intent;
                    const stripePaymentIntentId = typeof stripePaymentIntent === "string"
                        ? stripePaymentIntent
                        : stripePaymentIntent?.id;
                    const cycleProcessed = await db.transaction(async (tx) => {
                        const insertedPayment = await tx.insert(paymentTable).values({
                            userId: user.id,
                            stripePaymentIntentId,
                            stripeInvoiceId: invoice.id as string,
                            amount: invoice.amount_paid as number,
                            currency: invoice.currency as string,
                            status: "SUCCESS",
                            metadata: {
                                tierId: tier.id,
                                priceId: tier.stripePriceId,
                                productName: tier.name
                            },
                            receivedAt: new Date()
                        }).onConflictDoNothing({
                            target: paymentTable.stripeInvoiceId
                        }).returning({ id: paymentTable.id });

                        if (insertedPayment.length === 0) {
                            return false;
                        }

                        await tx.update(userTable).set({
                            credit: tier.features.maxCredits
                        }).where(eq(userTable.id, user.id));

                        await tx.update(subscriptionTable).set({
                            startsAt: new Date(invoice.period_start * 1000),
                            endsAt: new Date(invoice.period_end * 1000)
                        }).where(eq(subscriptionTable.id, subscription.id));
                        return true;
                    });
                    if (!cycleProcessed) {
                        console.log(" |- Duplicate subscription cycle invoice ignored", invoice.id);
                        break;
                    }

                    // 4. Send an email to the user
                    try {
                        await sendEmailForBillingCycle({
                            email: userEmail,
                            username: user.username,
                            invoiceURL: invoice.hosted_invoice_url as string,
                            userLocale: user.locale as Locale,
                        });
                    } catch (error) {
                        console.error('-x- Failed to send billing cycle email:', error);
                        // Don't throw - email failure shouldn't break webhook processing
                    }
                    break;
                };
                break;
            default:
                console.log("Unhandled event type", stripeEvent.type);
                break;
        }

        return {
            statusCode: 200,
            statusMessage: "Webhook received"
        };
    } catch (error) {
        console.error('-x- Error processing webhook:', error);
        throw createError({
            statusCode: 500,
            statusMessage: "Error processing webhook"
        });
    }
});