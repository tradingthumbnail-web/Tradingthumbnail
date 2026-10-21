import { type FluxKreaLoraInpaintingInput } from "@fal-ai/client/endpoints";

import fal from "~~/server/inference/fal";
import { type ModelName } from "~~/server/constants/models-db";

export const FLUX_INPAINTING_PARAMS = {
    num_inference_steps: 30,
    guidance_scale: 2.5,
    strength: 0.6,
    image_size: "landscape_16_9"
} as Partial<FluxKreaLoraInpaintingInput>;

export interface GenerateInpaintingQwenParams {
    model: ModelName;
    prompt: string;
    imageUrl: string;
    maskUrl: string;
};

export const generateInpaintingImage = async (params: GenerateInpaintingQwenParams) => {
    try {
        console.log(" |– Generating inpainting image with Fal...");

        const response = await fal.subscribe(params.model, {
            input: {
                prompt: params.prompt,
                image_url: params.imageUrl,
                mask_url: params.maskUrl,
                ...FLUX_INPAINTING_PARAMS,
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
        console.error("-x- Error generating inpainting image with FAL", error);
        throw error;
    }
};