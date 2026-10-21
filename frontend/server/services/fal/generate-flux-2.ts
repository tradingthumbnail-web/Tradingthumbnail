import fal from "~~/server/inference/fal";
import { type ModelName } from "~~/server/constants/models-db";
import { type StructuredPrompt } from "~~/shared/generation/types";
import { buildStructuredPromptJson, structuredPromptToString } from "~~/server/services/prompt/structured-prompt";

export const FLUX_2_PARAMS = {
    num_inference_steps: 28,
    guidance_scale: 3.5,
} as const;

export const FLUX_2_EDIT_PARAMS = {
    num_inference_steps: 28,
    guidance_scale: 3.0,
} as const;

export interface GenerateFlux2ImageParams {
    prompt: string | StructuredPrompt;
    numberOfImages: number;
    imageSize?: string;
    useStructuredPrompt?: boolean;
}

export interface GenerateFlux2ImageToImageParams extends GenerateFlux2ImageParams {
    referenceImageURL: string;
}

export interface GenerateFlux2WithLoraParams extends GenerateFlux2ImageParams {
    loraWeightsUrl: string;
    loraScale?: number;
}

function resolvePrompt(prompt: string | StructuredPrompt, useStructured: boolean): string {
    if (typeof prompt === 'string') {
        return prompt;
    }
    return useStructured ? buildStructuredPromptJson(prompt) : structuredPromptToString(prompt);
}

function resolveImageSize(size?: string): string {
    switch (size) {
        case '1:1':
            return 'square_hd';
        case '16:9':
            return 'landscape_16_9';
        case '4:3':
            return 'landscape_4_3';
        case '9:16':
            return 'portrait_16_9';
        default:
            return 'landscape_16_9';
    }
}

export async function generateFlux2Image(params: GenerateFlux2ImageParams): Promise<string[]> {
    try {
        console.log(" |- Generating image with Flux-2...");
        const model: ModelName = "fal-ai/flux-2";
        const finalPrompt = resolvePrompt(params.prompt, params.useStructuredPrompt ?? false);

        const response = await fal.subscribe(model, {
            input: {
                prompt: finalPrompt,
                num_images: params.numberOfImages,
                image_size: resolveImageSize(params.imageSize),
                ...FLUX_2_PARAMS,
            },
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                    update.logs.map(log => log.message).forEach(log => console.log(log));
                }
            }
        });

        if (!response.data?.images?.length) {
            console.error("-x- Failed to generate image with Flux-2", response.data);
            throw createError({
                statusMessage: "Failed to generate image",
                statusCode: 500,
            });
        }

        return response.data.images.map((image: { url: string }) => image.url);
    } catch (error) {
        console.error("-x- Error generating image with Flux-2", error);
        throw error;
    }
}

export async function generateFlux2ImageToImage(params: GenerateFlux2ImageToImageParams): Promise<string[]> {
    try {
        console.log(" |- Generating image-to-image with Flux-2 Kontext...");
        const model: ModelName = "fal-ai/flux-2/edit";
        const finalPrompt = resolvePrompt(params.prompt, params.useStructuredPrompt ?? false);

        const response = await fal.subscribe(model, {
            input: {
                prompt: finalPrompt,
                num_images: params.numberOfImages,
                image_urls: [params.referenceImageURL],
                image_size: resolveImageSize(params.imageSize),
                ...FLUX_2_EDIT_PARAMS,
            },
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                    update.logs.map(log => log.message).forEach(log => console.log(log));
                }
            }
        });

        if (!response.data?.images?.length) {
            console.error("-x- Failed to generate image-to-image with Flux-2", response.data);
            throw createError({
                statusMessage: "Failed to generate image",
                statusCode: 500,
            });
        }

        return response.data.images.map((image: { url: string }) => image.url);
    } catch (error) {
        console.error("-x- Error generating image-to-image with Flux-2", error);
        throw error;
    }
}

export async function generateFlux2WithLora(params: GenerateFlux2WithLoraParams): Promise<string[]> {
    try {
        console.log(" |- Generating image with Flux-2 and LoRA...");
        const model: ModelName = "fal-ai/flux-2/lora";
        const finalPrompt = resolvePrompt(params.prompt, params.useStructuredPrompt ?? false);

        const response = await fal.subscribe(model, {
            input: {
                prompt: finalPrompt,
                num_images: params.numberOfImages,
                image_size: resolveImageSize(params.imageSize),
                loras: [{
                    path: params.loraWeightsUrl,
                    scale: params.loraScale ?? 1,
                }],
                ...FLUX_2_PARAMS,
            },
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                    update.logs.map(log => log.message).forEach(log => console.log(log));
                }
            }
        });

        if (!response.data?.images?.length) {
            console.error("-x- Failed to generate image with Flux-2 LoRA", response.data);
            throw createError({
                statusMessage: "Failed to generate image",
                statusCode: 500,
            });
        }

        return response.data.images.map((image: { url: string }) => image.url);
    } catch (error) {
        console.error("-x- Error generating image with Flux-2 LoRA", error);
        throw error;
    }
}


