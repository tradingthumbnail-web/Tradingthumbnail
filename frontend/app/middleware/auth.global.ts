import { isPublicRoute, resolveAuthRouteGuard } from "~~/shared/clicklab/auth-routing";

export default defineNuxtRouteMiddleware(async (to) => {
    const userStore = useUserStore();

    if (!userStore.hasCheckedAuth) {
        await userStore.getMe();
    } else if (!userStore.user && !isPublicRoute(to.path)) {
        await userStore.getMe({ force: true });
    }

    const authed = Boolean(userStore.user);

    const decision = resolveAuthRouteGuard({
        path: to.path,
        fullPath: to.fullPath,
        query: to.query as Record<string, unknown>,
        authed,
        demoUi: false,
    });

    if (decision.action === 'redirect') {
        return navigateTo(decision.to);
    }
});
