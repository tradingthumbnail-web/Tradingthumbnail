export default defineEventHandler(async (event) => {
    setHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return {
        user: event.context.user || null,
        tier: event.context.tier || null,
        subscription: event.context.subscription || null,
    };
});