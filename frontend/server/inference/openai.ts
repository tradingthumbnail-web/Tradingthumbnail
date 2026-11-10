import OpenAI from "openai";

function readOpenAIConfig() {
    const config = typeof useRuntimeConfig === "function" ? useRuntimeConfig() : undefined;
    const openaiApiKey = (config?.openaiApiKey || process.env.NUXT_OPENAI_API_KEY || "").trim();
    return { openaiApiKey };
}

export function isOpenAIConfigured(): boolean {
    return Boolean(readOpenAIConfig().openaiApiKey);
}

export function assertOpenAIConfigured() {
    const { openaiApiKey } = readOpenAIConfig();
    if (!openaiApiKey) {
        console.error("-x- OpenAI API key is not set");
        throw createError({
            statusMessage: "OpenAI API key is not configured",
            statusCode: 503,
        });
    }
    return { openaiApiKey };
}

let cachedOpenAIClient: OpenAI | null = null;
let cachedOpenAIClientKey: string | null = null;

export function getOpenAIClient(): OpenAI {
    const { openaiApiKey } = assertOpenAIConfigured();
    if (!cachedOpenAIClient || cachedOpenAIClientKey !== openaiApiKey) {
        cachedOpenAIClient = new OpenAI({
            apiKey: openaiApiKey,
        });
        cachedOpenAIClientKey = openaiApiKey;
    }
    return cachedOpenAIClient;
}

/** Lazy OpenAI client — does not throw until first use. */
export const openai = new Proxy({} as OpenAI, {
    get(_target, prop, receiver) {
        const client = getOpenAIClient();
        const value = Reflect.get(client, prop, receiver);
        return typeof value === "function" ? value.bind(client) : value;
    },
});