import { randomUUID } from "crypto";
import { type EventType } from "~~/shared/event-types";


export const capturePosthogServerEvent = async (event: EventType, properties: Record<string, any>) => {
    const { PostHog } = await import("posthog-node");
    
    const config = useRuntimeConfig();
    const posthogApiKey = config.public.posthog.key;
    const posthogHost = config.public.posthog.host;

    if (!posthogApiKey || !posthogHost) {
        console.warn("-x- Posthog API key or host is not set, we're not tracking events :/");
        return;
    }

    const posthog = new PostHog(posthogApiKey, {
        host: posthogHost,
    });
    const distinctEventId = randomUUID();
    try {
        posthog.capture({
            event: event,
            distinctId: distinctEventId,
            properties: properties,
        });
    } catch (error) {
        console.error("-x- Error capturing Posthog event", error);
        return;
    } finally {
        await posthog.shutdown();
    }
};