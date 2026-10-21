import { type FluxKontextLoraInpaintInput } from "@fal-ai/client/endpoints";
import { type ModelName } from "~~/server/constants/models-db";

import fal from "~~/server/inference/fal";

export const FLUX_INPAINTING_FACE_CHANGE_PARAMS = {
    num_inference_steps: 30,
    guidance_scale: 3.5,
    strength: 0.6,
} as Partial<FluxKontextLoraInpaintInput>;

export interface GenerateInpaintingFaceChangeParams {
    model: ModelName;
    prompt: string;
    imageUrl: string;
    maskUrl: string;
    weightsUrl: string;
    weightsScale: number;
};

export const generateInpaintingFaceChange = async (params: GenerateInpaintingFaceChangeParams): Promise<Buffer> => {
    try {
        console.log(" |– Generating inpainting face change with FAL...")

        const response = await fal.subscribe(params.model, {
            input: {
                prompt: params.prompt,
                image_url: params.imageUrl,
                mask_url: params.maskUrl,
                ...FLUX_INPAINTING_FACE_CHANGE_PARAMS,
                loras: [{
                    path: params.weightsUrl,
                    scale: params.weightsScale
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
        console.error("-x- Error generating inpainting face change with FAL", error);
        throw error;
    }
}