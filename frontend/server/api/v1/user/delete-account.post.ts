import Stripe from "stripe";
import { eq, inArray } from "drizzle-orm";

import { db } from "~~/server/database";
import { imageTable } from "~~/server/database/schemas/image.schema";
import { avatarTable } from "~~/server/database/schemas/avatar.schema";
import { projectTable } from "~~/server/database/schemas/project.schema";
import { branchTable } from "~~/server/database/schemas/branch.schema";
import { stylesTable } from "~~/server/database/schemas/style.schema";
import { subscriptionTable } from "~~/server/database/schemas/subscription.schema";
import { userTable, type Locale } from "~~/server/database/schemas/user.schema";
import { assetTable } from "~~/server/database/schemas/assets.schema";
import { activityTable } from "~~/server/database/schemas/activity.schema";

import { sendAccountDeletionEmail } from "~~/server/services/emails/account-deletion";
import { createPolarClient, getPolarConfig } from "~~/server/services/polar/client";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    const config = useRuntimeConfig(event);
    const stripeSecretKey = config.stripe.secretKey;

    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    };

    try {
        // 1. Check that the user exists and it is the same as the one making the request
        const dbUser = await db.query.userTable.findFirst({
            where: eq(userTable.id, user.id),
        });
        if (!dbUser) {
            throw createError({ statusCode: 404, statusMessage: 'User not found' });
        }

        if (dbUser.id !== user.id) {
            throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
        }

        const existingSubscriptions = await db.query.subscriptionTable.findMany({
            where: eq(subscriptionTable.userId, dbUser.id),
        });
        const polarSubscriptionIds = existingSubscriptions
            .map((subscription) => subscription.polarSubscriptionId)
            .filter((id): id is string => Boolean(id));

        // 1. Delete all the images and assets of the user
        await db.transaction(async (trx) => {
            // Collect all user's image IDs and project IDs for branch cleanup
            const userImages = await trx.query.imageTable.findMany({
                columns: { id: true },
                where: eq(imageTable.userId, dbUser.id),
            });
            const userImageIds = userImages.map(i => i.id);

            const userProjects = await trx.query.projectTable.findMany({
                columns: { id: true },
                where: eq(projectTable.userId, dbUser.id),
            });
            const userProjectIds = userProjects.map(p => p.id);

            // Delete branches that reference any of the user's images (as root or head)
            if (userImageIds.length > 0) {
                await trx.delete(branchTable)
                    .where(inArray(branchTable.rootId, userImageIds));
                await trx.delete(branchTable)
                    .where(inArray(branchTable.headImageId, userImageIds));
            }

            // Also delete branches under the user's projects
            if (userProjectIds.length > 0) {
                await trx.delete(branchTable)
                    .where(inArray(branchTable.projectId, userProjectIds));
            }

            // Now safe to delete images
            await trx.delete(imageTable).where(eq(imageTable.userId, dbUser.id));
            await trx.delete(assetTable).where(eq(assetTable.userId, dbUser.id));
            await trx.delete(activityTable).where(eq(activityTable.userId, dbUser.id));
            await trx.delete(avatarTable).where(eq(avatarTable.userId, dbUser.id));
            await trx.delete(projectTable).where(eq(projectTable.userId, dbUser.id));
            await trx.delete(subscriptionTable).where(eq(subscriptionTable.userId, dbUser.id));
            await trx.delete(stylesTable).where(eq(stylesTable.createdBy, dbUser.id));
        });

        // 2. Cancel Polar subscriptions for this user (new billing)
        try {
            const { accessToken } = getPolarConfig(event);
            if (accessToken && polarSubscriptionIds.length > 0) {
                const polar = createPolarClient(event);
                for (const polarSubscriptionId of polarSubscriptionIds) {
                    try {
                        await polar.subscriptions.revoke({ id: polarSubscriptionId });
                    } catch (error) {
                        console.warn("Error canceling Polar subscription during account deletion", error);
                    }
                }
            }
        } catch (error) {
            console.warn("Polar cancellation skipped during account deletion", error);
        }

        // 3. Delete any remaining Stripe subscriptions
        if (dbUser.stripeCustomerId) {
            if (!stripeSecretKey) {
                throw createError({ statusCode: 500, statusMessage: 'Stripe secret key not found' });
            }
            const stripe = new Stripe(stripeSecretKey);
            const subscriptions = await stripe.subscriptions.list({
                customer: dbUser.stripeCustomerId,
            });
            for (const subscription of subscriptions.data) {
                await stripe.subscriptions.cancel(subscription.id);
            };
        }

        // 3. Delete the user from the database
        await db.delete(userTable).where(eq(userTable.id, dbUser.id));

        // 4. Send a deletion email to the user
        try {
            await sendAccountDeletionEmail({
                email: dbUser.email as string,
                username: dbUser.username as string,
                userLocale: dbUser.locale as Locale
            });
        } catch (error) {
            // Don't throw error - email failure shouldn't fail the account deletion
            console.warn("Error sending account deletion email", error);
        };

        return {
            statusCode: 200,
            statusMessage: 'Account deleted successfully'
        };
    } catch (error) {
        console.error("Error deleting account", error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});