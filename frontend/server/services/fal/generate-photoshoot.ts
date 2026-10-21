import { FluxKontextLoraInput } from "@fal-ai/client/endpoints";

import fal from "~~/server/inference/fal";
import { type ModelName } from "~~/server/constants/models-db";

export const FLUX_KONTEXT_LORA_PARAMS = {
    num_inference_steps: 30,
    guidance_scale: 2.5,
} as Partial<FluxKontextLoraInput>;

/**
 * 
 * @param params 
 */
export const generatePhotoshootImages = async ({
    model,
    prompt,
    numberOfImages,
    weightsPresignedUrl,
    imageSize = "landscape_4_3",
}: {
    model: ModelName;
    prompt: string;
    numberOfImages: number;
    weightsPresignedUrl: string;
    imageSize: string;
}) => {
    try {
        console.log(" |– Generating photoshoot images...")

        const response = await fal.subscribe(model, {
            input: {
                prompt,
                num_images: numberOfImages,
                ...FLUX_KONTEXT_LORA_PARAMS,
                image_size: imageSize,
                loras: [{
                    path: weightsPresignedUrl,
                    scale: 1
                }]
            },
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                    update.logs.map(log => log.message).forEach(log => console.log(log));
                }
            }
        });

        if (!response.data?.images.length) {
            console.error("-x- Failed to generate images", response.data);
            throw createError({
                statusMessage: "Failed to generate images",
                statusCode: 500,
            });
        };

        const imagesURLs = response.data.images.map((image: { url: string}) => image.url);

        return imagesURLs;
    } catch (error) {
        console.error("-x- Error generating photoshoot images", error);
        throw createError({
            statusMessage: 'Failed to generate photoshoot images',
            statusCode: 500,
        });
    }
};