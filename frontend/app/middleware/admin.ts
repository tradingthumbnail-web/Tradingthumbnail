import type { User } from "~~/server/database/schemas/user.schema";
import type { Tier } from "~~/server/database/schemas/tier.schema";
import type { Subscription } from "~~/server/database/schemas/subscription.schema";

export default defineNuxtRouteMiddleware(async (to, from) => {
    const { user } = await $fetch('/api/v1/auth/user') as { user: User | null, tier: Tier | null, subscription: Subscription | null };

    if (!user || user.role !== 'ADMIN') {
        return abortNavigation({
            statusCode: 403,
            statusMessage: 'Forbidden',
        });
    };
});