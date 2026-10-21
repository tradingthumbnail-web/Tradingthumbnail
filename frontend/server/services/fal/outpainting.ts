import { type FluxLoraFillInput } from "@fal-ai/client/endpoints";

import fal from "~~/server/inference/fal";
import { type ModelName } from "~~/server/constants/models-db";

interface GenerateOutpaintingImageParams {
    model: ModelName;
    prompt: string;
    imageUrl: string;
    maskUrl: string;
};

export const FLUX_LORA_FILL_PARAMS = {
    num_inference_steps: 28,
    guidance_scale: 30,
    strength: 0.8,
    paste_back: false
} as Partial<FluxLoraFillInput>;

export const generateOutpaintingImage = async (params: GenerateOutpaintingImageParams) => {
    try {
        console.log(" |– Generating outpainting image with Fal...")

        const response = await fal.subscribe(params.model, {
            input: {
                prompt: params.prompt,
                image_url: params.imageUrl,
                mask_url: params.maskUrl,
                ...FLUX_LORA_FILL_PARAMS,
            },
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
        console.error("-x- Error generating outpainting image with FAL", error);
        throw error;
    }
}