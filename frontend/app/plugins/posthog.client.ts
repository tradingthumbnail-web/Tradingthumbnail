import { defineNuxtPlugin, useRuntimeConfig } from '#imports'

import posthog from 'posthog-js'

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig();
    const noopClient = {
        capture: () => undefined,
        identify: () => undefined,
        reset: () => undefined,
    };

    try {
        if (process.env.NUXT_AUTHORIZE_POSTHOG === 'false') {
            return {
                provide: {
                    posthog: () => noopClient,
                },
            };
        }

        const posthogKey = String(config.public.posthog.key || '').trim();
        const posthogHost = String(config.public.posthog.host || '').trim();
        if (!posthogKey || !posthogHost) {
            return {
                provide: {
                    posthog: () => noopClient,
                },
            };
        }

        const posthogClient = posthog.init(posthogKey, {
            api_host: posthogHost,
            loaded: (posthog) => {
                if (import.meta.env.MODE === 'development') posthog.debug()
            },
        }) || noopClient;
    
        return {
            provide: {
                posthog: () => posthogClient,
            },
        };
    } catch (error) {
        console.error("Error initializing PostHog", error);
        return {
            provide: {
                posthog: () => noopClient,
            },
        };
    }
})