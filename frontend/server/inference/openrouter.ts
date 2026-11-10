import OpenAI from "openai";
import { getOpenAIClient, isOpenAIConfigured } from "~~/server/inference/openai";

export const OPENROUTER_SKETCH_IMAGE_MODEL = "openai/gpt-image-2";

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";

function readOpenRouterConfig() {
    const config = typeof useRuntimeConfig === "function" ? useRuntimeConfig() : undefined;
    const openRouterApiKey = (config?.openRouterApiKey || process.env.NUXT_OPEN_ROUTER_API_KEY || "").trim();
    const openRouterBaseURL = (config?.openRouterBaseURL || process.env.NUXT_OPEN_ROUTER_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
    return { openRouterApiKey, openRouterBaseURL };
}

export function isOpenRouterConfigured(): boolean {
    return Boolean(readOpenRouterConfig().openRouterApiKey);
}

/** Ensures OpenRouter is configured; throws a controlled error when a feature needs it. */
export function assertOpenRouterConfigured() {
    const { openRouterApiKey, openRouterBaseURL } = readOpenRouterConfig();
    if (!openRouterApiKey) {
        throw createError({
            statusCode: 503,
            statusMessage: "OpenRouter API key is not configured",
        });
    }
    return { openRouterApiKey, openRouterBaseURL };
}

let cachedInferenceClient: OpenAI | null = null;
let cachedInferenceClientKey: string | null = null;

export function getInferenceClient(): OpenAI {
    const { openRouterApiKey, openRouterBaseURL } = assertOpenRouterConfigured();
    if (!cachedInferenceClient || cachedInferenceClientKey !== openRouterApiKey) {
        cachedInferenceClient = new OpenAI({
            baseURL: openRouterBaseURL,
            apiKey: openRouterApiKey,
        });
        cachedInferenceClientKey = openRouterApiKey;
    }
    return cachedInferenceClient;
}

export function mapModelForOpenAIFallback(model: string): string {
    if (!model) return "gpt-4o-mini";
    if (model.startsWith("openai/")) {
        return model.slice("openai/".length);
    }
    if (model.includes("/")) {
        return "gpt-4o-mini";
    }
    return model;
}

function summarizeProviderErrorText(errorText: string): { code?: number | string; limitSource?: string } {
    if (!errorText) return {};
    try {
        const parsed = JSON.parse(errorText) as {
            error?: {
                code?: number | string;
                metadata?: { limit_source?: string };
            };
        };
        return {
            code: parsed?.error?.code,
            limitSource: parsed?.error?.metadata?.limit_source,
        };
    } catch {
        return {};
    }
}

/** Lazy OpenAI-compatible client — tries OpenRouter first and falls back to OpenAI for chat completions when configured. */
export const inferenceClient = new Proxy({} as OpenAI, {
    get(_target, prop, receiver) {
        if (prop === "chat") {
            return {
                completions: {
                    create: async (params: OpenAI.Chat.Completions.ChatCompletionCreateParams, options?: OpenAI.RequestOptions) => {
                        if (isOpenRouterConfigured()) {
                            try {
                                const client = getInferenceClient();
                                return await client.chat.completions.create(params as any, options);
                            } catch (openRouterError: any) {
                                const status = openRouterError?.status ?? openRouterError?.statusCode ?? "unknown";
                                if (!isOpenAIConfigured()) {
                                    throw openRouterError;
                                }
                                console.warn(" |- OpenRouter chat completion failed; falling back to OpenAI", { status });
                            }
                        } else if (!isOpenAIConfigured()) {
                            assertOpenRouterConfigured();
                        }

                        const fallbackClient = getOpenAIClient();
                        return await fallbackClient.chat.completions.create(
                            {
                                ...params,
                                model: mapModelForOpenAIFallback(params.model),
                            } as any,
                            options,
                        );
                    },
                },
            };
        }

        const client = getInferenceClient();
        const value = Reflect.get(client, prop, receiver);
        return typeof value === "function" ? value.bind(client) : value;
    },
});

type OpenRouterImageResponse = {
    data?: Array<{
        b64_json?: string;
        media_type?: string;
    }>;
};

export async function generateOpenRouterImage(input: {
    model: string;
    prompt: string;
    inputReferences?: string[];
    aspectRatio?: string;
    quality?: string;
    outputFormat?: string;
}): Promise<Buffer> {
    const { openRouterApiKey, openRouterBaseURL } = assertOpenRouterConfigured();

    const body: Record<string, unknown> = {
        model: input.model,
        prompt: input.prompt,
        n: 1,
        aspect_ratio: input.aspectRatio ?? "3:2",
        quality: input.quality ?? "medium",
        output_format: input.outputFormat ?? "png",
    };

    if (input.inputReferences && input.inputReferences.length > 0) {
        body.input_references = input.inputReferences.map((url) => ({
            type: "image_url",
            image_url: { url },
        }));
    }

    const response = await fetch(`${openRouterBaseURL}/images`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${openRouterApiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        const summary = summarizeProviderErrorText(errorText);
        console.error("-x- OpenRouter image generation failed", {
            status: response.status,
            ...(summary.code !== undefined ? { code: summary.code } : {}),
            ...(summary.limitSource ? { limitSource: summary.limitSource } : {}),
        });
        const err = createError({
            statusCode: 500,
            statusMessage: "Image generation failed",
        });
        (err as any).providerStatus = response.status;
        throw err;
    }

    const payload = await response.json() as OpenRouterImageResponse;
    const b64 = payload.data?.[0]?.b64_json;
    if (!b64) {
        console.error("-x- OpenRouter image generation returned no image data");
        throw createError({
            statusCode: 500,
            statusMessage: "Image generation failed",
        });
    }

    return Buffer.from(b64, "base64");
}
