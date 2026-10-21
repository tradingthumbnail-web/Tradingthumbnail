import { type Flux1DevImageToImageInput, type Flux1DevInput } from "@fal-ai/client/endpoints";

import fal from "~~/server/inference/fal";
import { type ModelName } from "~~/server/constants/models-db";

const FAL_OPENAI_GPT_IMAGE_2_EDIT = "openai/gpt-image-2/edit";
const FAL_GPT_IMAGE_15_EDIT = "fal-ai/gpt-image-1.5/edit";

function toFalGptQuality(quality: string | undefined): "low" | "medium" | "high" {
    if (quality === "low" || quality === "medium" || quality === "high") {
        return quality;
    }
    return "medium";
}

export const FLUX_IMAGE_TO_IMAGE_PARAMS = {
    strength: 0.95,
    guidance_scale: 3.5,
    num_inference_steps: 40,
} as Partial<Flux1DevImageToImageInput>;

export const FLUX_IMAGE_PARAMS = {
    num_inference_steps: 50,
} as Partial<Flux1DevInput>;

/**
 * Generates a quick image
 * @param prompt - The prompt to generate the image from
 * @param model - The model to use
 * @param numberOfImages - The number of images to generate
 * @param resolution - The resolution of the image
 * @param referenceImageURL - The URL of the reference image
 */
export const generateQuickImage = async ({
    model,
    prompt,
    numberOfImages,
    resolution,
}: {
    model: ModelName;
    prompt: string;
    numberOfImages: number;
    resolution: string;
}) => {
    try {
        console.log(" |– Generating quick image...")

        // Generate the image
        const response = await fal.subscribe(model, {
            input: {
                prompt,
                num_images: numberOfImages,
            },
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                    update.logs.map(log => log.message).forEach(log => console.log(log));
                }
            }
        });

        if (!response.data?.images.length) {
            console.error("-x- Failed to generate image", response.data);
            throw createError({
                statusMessage: "Failed to generate image",
                statusCode: 500,
            });
        };

        const imagesURLs = response.data.images.map((image: { url: string}) => image.url);

        return imagesURLs;
    } catch (error) {
        console.error("Error generating quick image", error);
        throw error;
    }
};

/**
 * Generates a quick image
 * @param prompt - The prompt to generate the image from
 * @param model - The model to use
 * @param numberOfImages - The number of images to generate
 * @param referenceImageURL - The URL of the reference image
 */
export const generateQuickImageToImage = async ({
    model,
    prompt,
    numberOfImages,
    resolution,
    referenceImageURL,
    imageQuality,
}: {
    model: ModelName;
    prompt: string;
    numberOfImages: number;
    resolution: string;
    referenceImageURL: string | null;
    imageQuality?: string;
}) => {
    try {
        console.log(" |– Generating quick image...")
        if (!referenceImageURL) {
            throw createError({
                statusMessage: "A reference image URL is required for image-to-image generation",
                statusCode: 400,
            });
        }

        let imageSize: string;
        switch (resolution) {
            case "1:1":
                imageSize = "square_hd";
                break;
            case "16:9":
                imageSize = "landscape_16_9";
                break;
            default:
                imageSize = "landscape_16_9";
                break;
        }

        const isGptImage2 = model === "gpt-image-2";
        const isGptImage15 = model === "gpt-image-1.5";
        const q = toFalGptQuality(imageQuality);

        const input = (isGptImage2 || isGptImage15)
            ? {
                prompt,
                image_urls: [referenceImageURL],
                num_images: numberOfImages,
                image_size: "auto" as const,
                quality: q,
                output_format: "png" as const,
            }
            : {
                prompt,
                num_images: numberOfImages,
                image_url: referenceImageURL,
                ...FLUX_IMAGE_TO_IMAGE_PARAMS,
                image_size: imageSize,
            };

        const endpointId = isGptImage2
            ? FAL_OPENAI_GPT_IMAGE_2_EDIT
            : isGptImage15
                ? FAL_GPT_IMAGE_15_EDIT
                : model;

        const response = await fal.subscribe(endpointId, {
            input,
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                    update.logs.map(log => log.message).forEach(log => console.log(log));
                }
            }
        });

        if (!response.data?.images.length) {
            console.error("-x- Failed to generate image", response.data);
            throw createError({
                statusMessage: "Failed to generate image",
                statusCode: 500,
            });
        };

        const imagesURLs = response.data.images.map((image: { url: string}) => image.url);

        return imagesURLs;
    } catch (error) {
        console.error("Error generating quick image", error);
        throw error;
    }
};