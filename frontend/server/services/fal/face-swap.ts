import { type ModelName } from "~~/server/constants/models-db";
import fal from "~~/server/inference/fal";

export interface GenerateFaceSwapParams {
    model: ModelName;
    sourceFaceUrl: string;
    targetImageUrl: string;
    enableOcclusionPrevention?: boolean;
}

export const generateFaceSwap = async (params: GenerateFaceSwapParams): Promise<Buffer> => {
    try {
        console.log(" |- Generating face swap with FAL...");
        const response = await fal.subscribe(params.model, {
            input: {
                source_face_url: params.sourceFaceUrl,
                target_image_url: params.targetImageUrl,
                enable_occlusion_prevention: params.enableOcclusionPrevention ?? false,
            },
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                    update.logs.map(log => log.message).forEach(log => console.log(log));
                }
            }
        });

        const imageUrl = response.data?.image?.url || response.data?.images?.[0]?.url;
        if (!imageUrl) {
            console.error("-x- Failed to generate face swap image", response.data);
            throw createError({
                statusMessage: "Failed to generate image",
                statusCode: 500,
            });
        }

        const res = await fetch(imageUrl);
        if (!res.ok) {
            throw createError({ statusMessage: 'Failed to download generated image', statusCode: 500 });
        }
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error("-x- Error generating face swap with FAL", error);
        throw error;
    }
};