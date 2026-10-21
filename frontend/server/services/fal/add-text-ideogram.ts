import type { IdeogramV3EditInput } from "@fal-ai/client/endpoints";

import { ModelName } from "~~/server/constants/models-db";
import fal from "~~/server/inference/fal";

interface AddTextIdeogramParams {
    model: ModelName;
    prompt: string;
    referenceImageURL: string;
    maskURL: string;
}

export const FLUX_IDEOGRAM_PARAMS = {
    rendering_speed: "BALANCED",
    expand_prompt: true,
    num_images: 1,
} as Partial<IdeogramV3EditInput>;

/**
 * @description Use gpt-image-1.5 instead
 * Adds text to an image using the ideogram@fal model
 * @param params - The parameters for the ideogram@fal model
 * @returns The generated image as a Buffer
 */
export const addTextIdeogram = async (params: AddTextIdeogramParams) => {
    try {
        console.log(" |– Adding text to the image with ideogram@fal...")

        const response = await fal.subscribe(params.model, {
            input: {
                prompt: params.prompt,
                image_url: params.referenceImageURL,
                mask_url: params.maskURL,
                ...FLUX_IDEOGRAM_PARAMS,
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
        }

        const imagesURLs = response.data.images.map((image: { url: string}) => image.url);

        const firstImageUrl = imagesURLs[0];
        if (!firstImageUrl) {
            throw createError({ statusMessage: 'No image URL returned by FAL', statusCode: 500 });
        }

        // Download the generated image and return as Buffer (avoid streaming bodies to S3)
        const res = await fetch(firstImageUrl);
        if (!res.ok) {
            throw createError({ statusMessage: 'Failed to download generated image', statusCode: 500 });
        }
        const arrayBuffer = await res.arrayBuffer();
        
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error("-x- Error generating image to image with Fal", error);
        throw error;
    }
}