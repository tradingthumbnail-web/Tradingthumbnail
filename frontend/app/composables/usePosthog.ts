import { eventTypes, type EventType } from '~~/shared/event-types';

export const usePosthog = () => {
    const { $posthog } = useNuxtApp();
    const posthog = $posthog();
    
    const track = (event: EventType, properties: Record<string, any>) => {
        posthog.capture(event, properties);
    };
    
    return {
        posthog,

        track,
    }
}