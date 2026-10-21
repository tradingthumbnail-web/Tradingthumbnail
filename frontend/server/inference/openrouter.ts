import OpenAI from "openai";

export const OPENROUTER_SKETCH_IMAGE_MODEL = "openai/gpt-image-2";

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";

function readOpenRouterConfig() {
    const config = useRuntimeConfig();
    const openRouterApiKey = config.openRouterApiKey?.trim() || "";
    const openRouterBaseURL = (config.openRouterBaseURL || DEFAULT_BASE_URL).replace(/\/$/, "");
    return { openRouterApiKey, openRouterBaseURL };
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

/** Lazy OpenAI client — does not throw until first use. */
export const inferenceClient = new Proxy({} as OpenAI, {
    get(_target, prop, receiver) {
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
        console.error("-x- OpenRouter image generation failed", response.status, errorText.slice(0, 500));
        throw createError({
            statusCode: 500,
            statusMessage: "Image generation failed",
        });
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
