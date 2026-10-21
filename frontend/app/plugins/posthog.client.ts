import { defineNuxtPlugin, useRuntimeConfig } from '#imports'

import posthog from 'posthog-js'

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig();
    try {
        if (process.env.NUXT_AUTHORIZE_POSTHOG === 'false') {
            return;
        }
        const posthogClient = posthog.init(config.public.posthog.key as string, {
            api_host: config.public.posthog.host as string,
            loaded: (posthog) => {
                if (import.meta.env.MODE === 'development') posthog.debug()
            },
        })
    
        return {
            provide: {
                posthog: () => posthogClient,
            },
        };
    } catch (error) {
        console.error("Error initializing PostHog", error);
        return;
    }
})