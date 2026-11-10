import { fal } from '@fal-ai/client';

let configuredFalKey: string | null = null;

function readFalConfig() {
    const config = typeof useRuntimeConfig === 'function' ? useRuntimeConfig() : undefined;
    const falApiKey = (config?.falApiKey || process.env.NUXT_FAL_API_KEY || '').trim();
    return { falApiKey };
}

export function isFalConfigured(): boolean {
    return Boolean(readFalConfig().falApiKey);
}

export function assertFalConfigured() {
    const { falApiKey } = readFalConfig();
    if (!falApiKey) {
        console.error('|-x- FAL API key is not set');
        throw createError({
            statusMessage: 'FAL API key is not set',
            statusCode: 503,
        });
    }
    if (configuredFalKey !== falApiKey) {
        fal.config({
            credentials: falApiKey,
        });
        configuredFalKey = falApiKey;
    }
    return fal;
}

const lazyFal = new Proxy(fal, {
    get(target, prop, receiver) {
        assertFalConfigured();
        const value = Reflect.get(target, prop, receiver);
        return typeof value === 'function' ? value.bind(target) : value;
    },
});

export default lazyFal;