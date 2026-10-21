import { type Flux1DevImageToImageInput } from "@fal-ai/client/endpoints";

import fal from "~~/server/inference/fal";
import { type ModelName } from "~~/server/constants/models-db";

export const FLUX_2_FINE_EDIT_PARAMS = {
    num_inference_steps: 30,
    guidance_scale: 2.5,
} as Partial<Flux1DevImageToImageInput>;

export interface GenerateFineEditedImageParams {
    model: ModelName;
    prompt: string;
    numberOfImages: number;
    imageSize: string;
    referenceImageURL: string;
}

/**
 * Generates a fine edited image
 * @param params - The parameters for the fine edited image
 * @returns The fine edited image URLs
 */
export const generateFineEditedImage = async (params: GenerateFineEditedImageParams) => {
    try {
        console.log(" |- Generating fine edited image...");

        const response = await fal.subscribe(params.model, {
            input: {
                prompt: params.prompt,
                num_images: params.numberOfImages,
                image_urls: [params.referenceImageURL],
                ...FLUX_2_FINE_EDIT_PARAMS,
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

        return imagesURLs;
    } catch (error) {
        console.error("-x- Error generating fine edited image", error);
        throw error;
    }
}