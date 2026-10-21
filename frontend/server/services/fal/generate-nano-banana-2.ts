import fal from "~~/server/inference/fal";
import { type ModelName, type ResolutionValue } from "~~/server/constants/models-db";

export const NANO_BANANA_2_PARAMS = {
    output_format: 'png',
    safety_tolerance: '4',
    limit_generations: true,
} as const;

export type NanoBanana2AspectRatio = 'auto' | '21:9' | '16:9' | '3:2' | '4:3' | '5:4' | '1:1' | '4:5' | '3:4' | '2:3' | '9:16';

export interface GenerateNanoBanana2ImageParams {
    prompt: string;
    numberOfImages: number;
    aspectRatio?: NanoBanana2AspectRatio;
    resolution?: ResolutionValue;
    enableWebSearch?: boolean;
}

export interface GenerateNanoBanana2ImageToImageParams extends GenerateNanoBanana2ImageParams {
    referenceImageURLs: string[];
}

function resolveAspectRatio(imageSize?: string): NanoBanana2AspectRatio {
    switch (imageSize) {
        case '1:1':
            return '1:1';
        case '16:9':
            return '16:9';
        case '4:3':
            return '4:3';
        case '9:16':
            return '9:16';
        case '3:2':
            return '3:2';
        default:
            return 'auto';
    }
}

export function mapImageSizeToAspectRatio(imageSize?: string): NanoBanana2AspectRatio {
    return resolveAspectRatio(imageSize);
}

export async function generateNanoBanana2Image(params: GenerateNanoBanana2ImageParams): Promise<string[]> {
    try {
        console.log(" |- Generating image with Nano Banana 2...");
        const model: ModelName = "fal-ai/nano-banana-2";

        const response = await fal.subscribe(model, {
            input: {
                prompt: params.prompt,
                num_images: params.numberOfImages,
                aspect_ratio: params.aspectRatio ?? 'auto',
                resolution: params.resolution ?? '1K',
                enable_web_search: params.enableWebSearch ?? false,
                ...NANO_BANANA_2_PARAMS,
            },
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                    update.logs.map(log => log.message).forEach(log => console.log(log));
                }
            }
        });

        if (!response.data?.images?.length) {
            console.error("-x- Failed to generate image with Nano Banana 2", response.data);
            throw createError({
                statusMessage: "Failed to generate image",
                statusCode: 500,
            });
        }

        return response.data.images.map((image: { url: string }) => image.url);
    } catch (error) {
        console.error("-x- Error generating image with Nano Banana 2", error);
        throw error;
    }
}

const NANO_BANANA_2_EDIT_MODEL = "fal-ai/nano-banana-2/edit" as const;

export async function generateNanoBanana2ImageToImage(params: GenerateNanoBanana2ImageToImageParams): Promise<string[]> {
    try {
        console.log(" |- Generating image-to-image with Nano Banana 2...");
        const response = await fal.subscribe(NANO_BANANA_2_EDIT_MODEL, {
            input: {
                prompt: params.prompt,
                num_images: params.numberOfImages,
                image_urls: params.referenceImageURLs,
                aspect_ratio: params.aspectRatio ?? 'auto',
                resolution: params.resolution ?? '1K',
                enable_web_search: params.enableWebSearch ?? false,
                ...NANO_BANANA_2_PARAMS,
            },
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                    update.logs.map(log => log.message).forEach(log => console.log(log));
                }
            }
        });

        if (!response.data?.images?.length) {
            console.error("-x- Failed to generate image-to-image with Nano Banana 2", response.data);
            throw createError({
                statusMessage: "Failed to generate image",
                statusCode: 500,
            });
        }

        return response.data.images.map((image: { url: string }) => image.url);
    } catch (error) {
        console.error("-x- Error generating image-to-image with Nano Banana 2", error);
        throw error;
    }
}