import Stripe from "stripe";

import { eq } from "drizzle-orm";

import { db } from "~~/server/database";
import { Tier, tierTable } from "~~/server/database/schemas/tier.schema";
import { paymentTable } from "~~/server/database/schemas/payment.schema";
import { userTable, type Locale } from "~~/server/database/schemas/user.schema";
import { subscriptionTable } from "~~/server/database/schemas/subscription.schema";

import { addAvatarCreditsToUser } from "~~/server/services/user/add-avatar-credits-to-user";
import { processBundleProduct } from "~~/server/services/user/process-bundle-product";
import { sendSubscriptionActivationEmail } from "~~/server/services/emails/subscription-activation";
import { sendPurchaseConfirmationEmail } from "~~/server/services/emails/purchase-confirmation";
import { log } from "~~/server/utils/logger";

async function getReceiptUrl(stripe: Stripe, paymentIntentId: string | null): Promise<string | null> {
    if (!paymentIntentId) return null;
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
            expand: ['latest_charge'],
        });
        const charge = paymentIntent.latest_charge as Stripe.Charge | null;
        return charge?.receipt_url || null;
    } catch (error) {
        log.warn('Failed to get receipt URL', { paymentIntentId, error });
        return null;
    }
}

export default defineEventHandler(async (event) => {
    // Recieve webhook
    let stripeEvent: Stripe.Event | null = null;
    log.info("Receiving webhook for a completed checkout session");
    const body = await readRawBody(event, "utf-8");

    if (!body) {
        throw createError({
            statusCode: 400,
            statusMessage: "No body in the webhook request"
        });
    }

    // Verify the webhook
    const signature = event.headers.get("stripe-signature");
    log.debug("Validating signature for a completed checkout session");
    if (!signature) {
        throw createError({
            statusCode: 400,
            statusMessage: "No signature"
        });
    };

    // Stripe object
    const config = useRuntimeConfig(event);
    const stripeSecretKey = config.stripe.secretKey;
    const stripeWebhookSecret = config.stripe.webhookSecret.payment;
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
        log.error("Error verifying webhook", error);
        throw createError({
            statusCode: 400,
            statusMessage: "Error verifying webhook"
        });
    };

    log.debug("Completed checkout session webhook data", { eventType: stripeEvent.type });
    const metadata = (stripeEvent.data.object as Stripe.Checkout.Session).metadata;
    const session = stripeEvent.data.object as Stripe.Checkout.Session;
    if (!metadata) {
        throw createError({
            statusCode: 400,
            statusMessage: "No metadata"
        });
    };
    const userId = metadata.userId;
    const tierId = metadata.tierId;
    const priceId = metadata.priceId;
    const productName = metadata.productName;
    const productId = metadata.productId;
    
    if (!userId) {
        throw createError({
            statusCode: 400,
            statusMessage: "No userId in metadata"
        });
    };

    // If there is a tierId, check that the tier the user is subscribing to is valid
    let tier: Tier | null | undefined = null;
    if (tierId) {
        tier = await db.query.tierTable.findFirst({
            where: eq(tierTable.id, Number(tierId))
        });
        if (!tier) {
            throw createError({
                statusCode: 400,
                statusMessage: "Tier not found in the database"
            });
        }
    };

    // Check that the user is valid
    const user = await db.query.userTable.findFirst({
        where: eq(userTable.id, userId)
    });
    if (!user) {
        throw createError({
            statusCode: 400,
            statusMessage: "User not found in the database"
        });
    };

    if (productId && productName) {
        const normalizedProductName = productName.toLowerCase();
        const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null;
        const invoiceId = typeof session.invoice === 'string' ? session.invoice : null;
        
        if (normalizedProductName === 'avatar') {
            try {
                await db.transaction(async (tx) => {
                    await tx.insert(paymentTable).values({
                        userId: userId,
                        stripePaymentIntentId: paymentIntentId,
                        stripeInvoiceId: invoiceId,
                        amount: session.amount_total as number,
                        currency: session.currency ?? "EUR",
                        status: "SUCCESS",
                        metadata: {
                            tierId: tierId,
                            priceId: priceId,
                            productId: productId,
                            productName: productName
                        }
                    }).onConflictDoNothing();

                    await addAvatarCreditsToUser({
                        userId: userId as string,
                        amount: 1
                    });
                });
                log.info("Avatar credit added to user", { userId });

                try {
                    const receiptUrl = await getReceiptUrl(stripe, paymentIntentId);
                    await sendPurchaseConfirmationEmail({
                        email: user.email as string,
                        username: user.username as string,
                        productName: 'Avatar Credit',
                        amount: session.amount_total as number,
                        currency: session.currency ?? "EUR",
                        receiptUrl,
                        userLocale: user.locale as Locale,
                    });
                } catch (emailError) {
                    log.error('Failed to send purchase confirmation email, but continuing', emailError, { userId });
                }

                return {
                    statusCode: 200,
                    statusMessage: "Avatar credit added to user"
                };
            } catch (error) {
                log.error("Error processing avatar payment", error, { userId });
                throw error;
            }
        } else {
            try {
                await db.transaction(async (tx) => {
                    await tx.insert(paymentTable).values({
                        userId: userId,
                        stripePaymentIntentId: paymentIntentId,
                        stripeInvoiceId: invoiceId,
                        amount: session.amount_total as number,
                        currency: session.currency ?? "EUR",
                        status: "SUCCESS",
                        metadata: {
                            productId: productId,
                            priceId: priceId,
                            productName: productName
                        }
                    }).onConflictDoNothing();

                    await processBundleProduct({
                        userId: userId as string,
                        productId: productId as string
                    });
                });
                log.info("Bundle product processed", { userId, productId });

                try {
                    const receiptUrl = await getReceiptUrl(stripe, paymentIntentId);
                    await sendPurchaseConfirmationEmail({
                        email: user.email as string,
                        username: user.username as string,
                        productName: productName,
                        amount: session.amount_total as number,
                        currency: session.currency ?? "EUR",
                        receiptUrl,
                        userLocale: user.locale as Locale,
                    });
                } catch (emailError) {
                    log.error('Failed to send purchase confirmation email, but continuing', emailError, { userId });
                }

                return {
                    statusCode: 200,
                    statusMessage: "Bundle product processed successfully"
                };
            } catch (error) {
                log.error("Error processing bundle product", error, { userId, productId });
                throw error;
            }
        }
    }

    if (!tier) {
        throw createError({
            statusCode: 400,
            statusMessage: "No tier or product found in metadata"
        });
    };

    // Select the type of event
    switch (stripeEvent.type) {
        case "checkout.session.completed":
            // Save the subscription to our database and update user's stripe customer id
            const customerId = typeof session.customer === 'string' ? session.customer : typeof session.customer === 'object' ? session.customer?.id : null;
            const subscriptionPaymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null;
            const subscriptionInvoiceId = typeof session.invoice === 'string' ? session.invoice : null;
            
            try {
                await db.transaction(async (tx) => {
                    await tx.insert(paymentTable).values({
                        userId: userId,
                        stripePaymentIntentId: subscriptionPaymentIntentId,
                        stripeInvoiceId: subscriptionInvoiceId,
                        amount: session.amount_total as number,
                        currency: session.currency ?? "EUR",
                        status: "SUCCESS",
                        metadata: {
                            tierId: tierId,
                            priceId: priceId,
                            productName: productName
                        }
                    }).onConflictDoNothing();

                    await tx.insert(subscriptionTable).values({
                        userId: userId as string,
                        tierId: Number(tierId),
                        stripeSubscriptionId: session.subscription as string,
                        status: "ACTIVE",
                        startsAt: new Date(session.created * 1000),
                        endsAt: new Date(session.expires_at * 1000)
                    }).onConflictDoNothing();

                    await tx.update(userTable).set({
                        stripeCustomerId: customerId as string,
                        credit: user.credit + (tier.features.maxCredits ?? 0),
                        avatarCredit: user.avatarCredit + 1,
                        updatedAt: new Date()
                    }).where(eq(userTable.id, userId));
                });
            } catch (error) {
                log.error("Error saving subscription and user's stripe customer id to database", error, { userId, tierId });
                throw error;
            };

            // Send email to the user
            try {
                await sendSubscriptionActivationEmail(user.email as string, user.username as string, user.locale as Locale);
            } catch (error) {
                log.error('Failed to send activation email, but continuing webhook processing', error, { userId });
            }
            break;
        default:
            log.warn("Unhandled event type", { eventType: stripeEvent.type });
            break;
    };

    return {
        statusCode: 200,
        statusMessage: "Webhook received"
    };
});