import type { TaskType } from "~~/shared/generation/types";

export default defineNuxtPlugin((nuxtApp) => {
    // Safe translator without using composables
    const t = (key: string) => {
        try {
            const i18n = (nuxtApp as any).$i18n;
            return i18n?.t ? i18n.t(key) : key;
        } catch {
            return key;
        }
    };

    const baseURL = typeof window !== 'undefined'
        ? `${window.location.origin}/api/v1/generation`
        : '/api/v1/generation';
    const generationApi = $fetch.create({
        baseURL,
        credentials: 'include',
        onRequest: async ({ request, options }) => {
            try {
                const url = '/api/v1/auth/user';
                const { user, tier } = await $fetch(url) as { user: any, tier: any };
                if (!user) {
                    throw createError({ statusCode: 401, statusMessage: t('common.errors.userNotAuthenticated') });
                }

                const headers = options.headers || {};
                const activity = (headers instanceof Headers ? headers.get('X-Activity') : headers['X-Activity']) as TaskType | undefined;
                const creditsRaw = headers instanceof Headers ? headers.get('X-Credits') : headers['X-Credits'];
                const creditsRequired = creditsRaw ? parseInt(String(creditsRaw), 10) : 2;

                if (!activity || !creditsRequired) {
                    console.error("Bad request", { activity, creditsRequired });
                    throw createError({ statusCode: 400, statusMessage: t('common.errors.badRequest') });
                }
                if (user.credit < creditsRequired) {
                    console.error("Insufficient credits", { userCredit: user.credit, creditsRequired });
                    throw createError({ statusCode: 402, statusMessage: t('common.errors.insufficientCredits') });
                }

                (options as any).__creditsToDeduct = creditsRequired;
            } catch (err) {
                console.error("Error in generation API onRequest", err);
                throw err;
            }
        },
        onResponse: async ({ response }) => {
            if (response.status >= 200 && response.status < 300) {
                try {
                    const userStore = useUserStore();
                    await userStore.getMe({ locale: null });
                } catch (storeError) {
                    console.warn("Could not refresh user store after generation");
                }
            }
        },
        onResponseError: async ({ response }) => {
            let errorData = null;
            try {
                errorData = await response._data || await response.json();
            } catch (e) {
                console.error("Could not parse error response", e);
            }
            
            if (response.status === 402) {
                console.error("Insufficient credits", errorData);
                throw createError({ statusCode: 402, statusMessage: t('common.errors.insufficientCredits') });
            } else if (response.status === 403) {
                console.error("No active subscription", errorData);
                throw createError({ statusCode: 403, statusMessage: t('common.errors.noActiveSubscription') });
            } else if (response.status === 401) {
                console.error("User not authenticated", errorData);
                throw createError({ statusCode: 401, statusMessage: t('common.errors.userNotAuthenticated') });
            } else if (response.status === 404) {
                console.error("Generation endpoint not found", errorData);
                throw createError({ statusCode: 404, statusMessage: t('common.errors.generationEndpointNotFound') });
            } else if (response.status === 500) {
                console.error("Internal server error", errorData);
                throw createError({ statusCode: 500, statusMessage: t('common.errors.internalServerError') });
            } else if (response.status === 400) {
                console.error("Bad request", errorData);
                throw createError({ statusCode: 400, statusMessage: t('common.errors.badRequest') });
            } else {
                console.error("Unknown error", errorData);
                throw createError({ statusCode: 500, statusMessage: t('common.errors.unknownError') });
            }
        }
    });

    return {
        provide: { generationApi }
    }
})