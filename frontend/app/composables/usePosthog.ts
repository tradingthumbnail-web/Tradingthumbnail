import { eventTypes, type EventType } from '~~/shared/event-types';

export const usePosthog = () => {
    const { $posthog } = useNuxtApp();
    const posthog = typeof $posthog === 'function'
        ? $posthog()
        : {
            capture: () => undefined,
            identify: () => undefined,
            reset: () => undefined,
        };
    
    const track = (event: EventType, properties: Record<string, any>) => {
        posthog.capture(event, properties);
    };
    
    return {
        posthog,

        track,
    }
}