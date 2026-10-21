import { randomUUID } from 'crypto';

export default defineEventHandler((event) => {
    const requestId = randomUUID();
    event.context.requestId = requestId;
    setHeader(event, 'X-Request-ID', requestId);
});

declare module 'h3' {
    interface H3EventContext {
        requestId?: string;
    }
}

