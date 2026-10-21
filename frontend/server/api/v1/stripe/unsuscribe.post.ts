import Stripe from "stripe";
import { desc, eq } from "drizzle-orm";

import { db } from "~~/server/database";
import { subscriptionTable } from "~~/server/database/schemas/subscription.schema";
import { userTable } from "~~/server/database/schemas/user.schema";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    const config = useRuntimeConfig(event);
    const stripeSecretKey = config.stripe.secretKey;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    };

    if (!stripeSecretKey) {
        throw createError({ statusCode: 500, statusMessage: 'Stripe secret key not found' });
    }

    try {
        // 1. Check if the user has a subscription
        const subscription = await db.query.subscriptionTable.findFirst({
            where: eq(subscriptionTable.userId, user.id),
            orderBy: desc(subscriptionTable.createdAt),
        });
        if (!subscription || !subscription.stripeSubscriptionId) {
            throw createError({ statusCode: 400, statusMessage: 'User does not have a subscription' });
        }
        
        // 3. cancel the stripe subscription
        const stripe = new Stripe(stripeSecretKey);
        try {
            await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        } catch (error) {
            console.error(error);
            throw createError({ statusCode: 500, statusMessage: 'Error canceling stripe subscription' });
        };

        // 2. If the user has a subscription, cancel it
        await db.update(subscriptionTable).set({
            status: 'CANCELLED',
        }).where(eq(subscriptionTable.id, subscription.id));
        
        // 4. Update the user's stripe customer id to null
        await db.update(userTable).set({
            stripeCustomerId: null,
            updatedAt: new Date(),
        }).where(eq(userTable.id, user.id));
        
        return {
            message: 'Subscription canceled successfully',
        };
    } catch (error: any) {
        console.error(error);
        if (error.statusCode) {
            throw error;
        }
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    };
});