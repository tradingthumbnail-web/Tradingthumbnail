import type { User } from "~~/server/database/schemas/user.schema";
import type { Tier } from "~~/server/database/schemas/tier.schema";
import type { Subscription } from "~~/server/database/schemas/subscription.schema";
import { resolveAuthRouteGuard } from "~~/shared/clicklab/auth-routing";
import { DEMO_UI_COOKIE, isDemoUiCookieActive } from "~~/shared/clicklab/demo-auth";

export default defineNuxtRouteMiddleware(async (to) => {
    let user: User | null = null;

    try {
        const session = await $fetch('/api/v1/auth/user') as {
            user: User | null;
            tier: Tier | null;
            subscription: Subscription | null;
        };
        user = session.user;
    } catch {
        // Backend unavailable or auth middleware error — treat as guest for route guards only.
        user = null;
    }

    const demoUiCookie = useCookie(DEMO_UI_COOKIE);
    const demoUi = isDemoUiCookieActive(demoUiCookie.value);
    const authed = Boolean(user) || demoUi;

    const decision = resolveAuthRouteGuard({
        path: to.path,
        fullPath: to.fullPath,
        query: to.query as Record<string, unknown>,
        authed,
        demoUi,
    });

    if (decision.action === 'redirect') {
        return navigateTo(decision.to);
    }
});
