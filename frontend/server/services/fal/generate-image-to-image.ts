import type { FluxKreaLoraImageToImageInput } from "@fal-ai/client/endpoints";

import { ModelName } from "~~/server/constants/models-db";
import fal from "~~/server/inference/fal";

interface GenerateImageToImageParams {
    model: ModelName;
    prompt: string;
    numberOfImages: number;
    referenceImageURL: string;
    loraPresignedUrl: string;
}

export const FLUX_IMAGE_TO_IMAGE_PARAMS = {
    strength: 0.95,
    guidance_scale: 3.5,
    num_inference_steps: 40,
} as Partial<FluxKreaLoraImageToImageInput>;

export const generateImageToImage = async (params: GenerateImageToImageParams) => {
    try {
        console.log(" |– Generating image to image with Fal...")

        const response = await fal.subscribe(params.model, {
            input: {
                prompt: params.prompt,
                num_images: params.numberOfImages,
                image_url: params.referenceImageURL,
                loras: [{
                    path: params.loraPresignedUrl,
                    scale: 0.8,
                }],
                ...FLUX_IMAGE_TO_IMAGE_PARAMS,
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
        console.error("-x- Error generating image to image with Fal", error);
        throw error;
    }
}