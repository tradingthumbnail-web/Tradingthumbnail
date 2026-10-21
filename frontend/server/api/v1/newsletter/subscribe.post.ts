import { isValidEmail } from '~~/server/utils/email';

const BEEHIIV_SUBSCRIPTIONS_URL = 'https://api.beehiiv.com/v2/publications';

export default defineEventHandler(async (event) => {
    const { email } = await readBody<{ email?: unknown }>(event);

    if (!isValidEmail(email)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid email',
        });
    }

    const config = useRuntimeConfig(event);
    const apiKey = config.beehiiv?.apiKey;
    const publicationId = config.beehiiv?.publicationId;

    if (!apiKey || !publicationId) {
        throw createError({
            statusCode: 503,
            statusMessage: 'Newsletter is not configured',
        });
    }

    try {
        const response = await fetch(
            `${BEEHIIV_SUBSCRIPTIONS_URL}/${encodeURIComponent(publicationId)}/subscriptions`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    reactivate_existing: true,
                    send_welcome_email: true,
                    utm_source: 'kithumbs-app',
                }),
            },
        );

        if (response.ok || response.status === 409) {
            return { success: true };
        }

        throw createError({
            statusCode: 502,
            statusMessage: 'Unable to subscribe right now',
        });
    } catch (error) {
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error;
        }
        throw createError({
            statusCode: 502,
            statusMessage: 'Unable to subscribe right now',
        });
    }
});
