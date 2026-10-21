import { eq } from "drizzle-orm";

import { db } from "~~/server/database";
import { subscriptionTable } from "~~/server/database/schemas/subscription.schema";

export async function applyVerifiedSubscriptionCancellation(stripeSubscriptionId: string): Promise<{
    userId: string | null;
    status: "updated" | "already-cancelled" | "not-found";
}> {
    const subscription = await db.query.subscriptionTable.findFirst({
        where: eq(subscriptionTable.stripeSubscriptionId, stripeSubscriptionId),
    });

    if (!subscription?.userId) {
        return { userId: null, status: "not-found" };
    }

    if (subscription.status === "CANCELLED") {
        return { userId: subscription.userId, status: "already-cancelled" };
    }

    await db.update(subscriptionTable)
        .set({ status: "CANCELLED" })
        .where(eq(subscriptionTable.id, subscription.id));

    return { userId: subscription.userId, status: "updated" };
}
