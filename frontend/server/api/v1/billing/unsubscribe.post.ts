import Stripe from "stripe";
import { desc, eq } from "drizzle-orm";

import { db } from "~~/server/database";
import { subscriptionTable } from "~~/server/database/schemas/subscription.schema";
import { userTable } from "~~/server/database/schemas/user.schema";
import { createPolarClient } from "~~/server/services/polar/client";
import { isPolarSubscription } from "~~/server/services/polar/catalog";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const subscription = await db.query.subscriptionTable.findFirst({
        where: eq(subscriptionTable.userId, user.id),
        orderBy: desc(subscriptionTable.createdAt),
    });
    if (!subscription) {
        throw createError({ statusCode: 400, statusMessage: "User does not have a subscription" });
    }

    try {
        if (isPolarSubscription(subscription) && subscription.polarSubscriptionId) {
            const polar = createPolarClient(event);
            await polar.subscriptions.revoke({ id: subscription.polarSubscriptionId });
            await db.update(subscriptionTable).set({
                status: "CANCELLED",
            }).where(eq(subscriptionTable.id, subscription.id));
            return { message: "Subscription canceled successfully", provider: "polar" };
        }

        if (!subscription.stripeSubscriptionId) {
            throw createError({ statusCode: 400, statusMessage: "User does not have a subscription" });
        }

        const config = useRuntimeConfig(event);
        const stripeSecretKey = config.stripe.secretKey;
        if (!stripeSecretKey) {
            throw createError({ statusCode: 500, statusMessage: "Stripe secret key not found" });
        }

        const stripe = new Stripe(stripeSecretKey);
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        await db.update(subscriptionTable).set({
            status: "CANCELLED",
        }).where(eq(subscriptionTable.id, subscription.id));
        await db.update(userTable).set({
            stripeCustomerId: null,
            updatedAt: new Date(),
        }).where(eq(userTable.id, user.id));

        return { message: "Subscription canceled successfully", provider: "stripe" };
    } catch (error: any) {
        if (error?.statusCode) throw error;
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: "Internal server error" });
    }
});
