import { randomUUID } from "crypto";

import { capturePosthogServerEvent } from "~~/server/posthog";
import { FAL_MODEL_COSTS, type ModelName } from "~~/server/constants/models-db";

import { type Image } from "~~/server/database/schemas/image.schema";
import { type StructuredPrompt } from "~~/shared/generation/types";

import { optimizePrompt } from "~~/server/services/prompt/optimize-prompt";
import { generateQuickImage, generateQuickImageToImage, FLUX_IMAGE_TO_IMAGE_PARAMS, FLUX_IMAGE_PARAMS } from "~~/server/services/fal/generate-quick-image";
import { generateFlux2Image, generateFlux2ImageToImage, FLUX_2_PARAMS, FLUX_2_EDIT_PARAMS } from "~~/server/services/fal/generate-flux-2";
import { generateNanoBanana2Image, generateNanoBanana2ImageToImage, NANO_BANANA_2_PARAMS, mapImageSizeToAspectRatio } from "~~/server/services/fal/generate-nano-banana-2";
import { type ResolutionValue } from "~~/server/constants/models-db";

import { storage } from "~~/server/storage";
import { saveImageToDB } from "~~/server/services/image.service";
import { saveAssetToDB } from "~~/server/services/asset";
import { generateAssetStorageKey, generateImageStorageKey } from "~~/server/storage/keys";
import { saveActivity } from "~~/server/services/activity/save-activity";
import { runChargedWork } from "~~/server/services/user/credits";
import { clampQuickGenerationImageCount, computeQuickGenerationCost } from "~~/server/services/generation/generation-cost";

interface QuickGenerationBody {
    prompt: string;
    imageQuality: string;
    numberOfImages: number;
    model?: ModelName;
    advanced: {
        promptImprovement: boolean;
        imageSize: string;
        useStructuredPrompt?: boolean;
        structuredPromptData?: StructuredPrompt;
    };
    referenceImageBase64: string | null;
    imageType: 'assets' | 'background';
    modelOptions?: {
        resolution?: ResolutionValue;
        enableWebSearch?: boolean;
    };
}

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const body = await readBody<QuickGenerationBody>(event);
    const {
        prompt,
        imageQuality,
        numberOfImages: requestedNumberOfImages,
        model: requestedModel,
        advanced: {
            promptImprovement,
            imageSize,
            useStructuredPrompt = false,
            structuredPromptData,
        },
        referenceImageBase64,
        imageType,
        modelOptions,
    } = body;

    const hasValidPrompt = prompt || (useStructuredPrompt && structuredPromptData?.scene);
    if (!hasValidPrompt || !imageQuality || !requestedNumberOfImages || !imageSize) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request' });
    }

    const numberOfImages = clampQuickGenerationImageCount(requestedNumberOfImages);
    const cost = computeQuickGenerationCost({
        numberOfImages,
        imageQuality,
        model: requestedModel,
        advanced: { useStructuredPrompt },
        modelOptions,
    });

    try {
        return await runChargedWork(user.id, cost, async () => {
        console.log('--- Starting quick generation...');
        const useFlux2 = useStructuredPrompt && structuredPromptData;

        const hasReferenceImage = referenceImageBase64 !== null;
        let optimizedPrompt = prompt;
        if (promptImprovement && !useFlux2) {
            const generatedOptimizedPrompt = await optimizePrompt(prompt, imageType);
            if (generatedOptimizedPrompt) optimizedPrompt = generatedOptimizedPrompt;
            console.log(' |- Optimized prompt: ', optimizedPrompt);
        }

        let generatedImagesURLs: string[] = [];
        let model: ModelName;
        let generationParams: Record<string, unknown>;

        const isNanoBanana2 = requestedModel === 'fal-ai/nano-banana-2';

        if (isNanoBanana2) {
            console.log(' |- Using Nano Banana 2');
            model = "fal-ai/nano-banana-2";
            generationParams = { ...NANO_BANANA_2_PARAMS, resolution: modelOptions?.resolution, enableWebSearch: modelOptions?.enableWebSearch };

            if (hasReferenceImage && referenceImageBase64) {
                const referenceImageBuffer = Buffer.from(referenceImageBase64, 'base64');
                const assetId = randomUUID();
                const referenceImageStorageKey = generateAssetStorageKey(user.id, 'AVATAR', assetId);

                await storage.put(referenceImageStorageKey, referenceImageBuffer, 'image/png');
                await saveAssetToDB({
                    userId: user.id,
                    name: 'Reference Image',
                    type: 'OBJECT',
                    storageKey: referenceImageStorageKey,
                });

                const referenceImageURL = await storage.generatePresignedUrl(referenceImageStorageKey);
                generatedImagesURLs = await generateNanoBanana2ImageToImage({
                    prompt: optimizedPrompt,
                    numberOfImages,
                    aspectRatio: mapImageSizeToAspectRatio(imageSize),
                    resolution: modelOptions?.resolution ?? '1K',
                    enableWebSearch: modelOptions?.enableWebSearch ?? false,
                    referenceImageURLs: [referenceImageURL],
                });
            } else {
                generatedImagesURLs = await generateNanoBanana2Image({
                    prompt: optimizedPrompt,
                    numberOfImages,
                    aspectRatio: mapImageSizeToAspectRatio(imageSize),
                    resolution: modelOptions?.resolution ?? '1K',
                    enableWebSearch: modelOptions?.enableWebSearch ?? false,
                });
            }
        } else if (useFlux2) {
            console.log(' |- Using Flux-2 with structured prompt');
            if (hasReferenceImage && referenceImageBase64) {
                const referenceImageBuffer = Buffer.from(referenceImageBase64, 'base64');
                const assetId = randomUUID();
                const referenceImageStorageKey = generateAssetStorageKey(user.id, 'AVATAR', assetId);

                await storage.put(referenceImageStorageKey, referenceImageBuffer, 'image/png');
                await saveAssetToDB({
                    userId: user.id,
                    name: 'Reference Image',
                    type: 'OBJECT',
                    storageKey: referenceImageStorageKey,
                });

                const referenceImageURL = await storage.generatePresignedUrl(referenceImageStorageKey);
                model = "fal-ai/flux-2/edit";
                generationParams = FLUX_2_EDIT_PARAMS;
                generatedImagesURLs = await generateFlux2ImageToImage({
                    prompt: structuredPromptData,
                    numberOfImages,
                    imageSize,
                    referenceImageURL,
                    useStructuredPrompt: true,
                });
            } else {
                model = "fal-ai/flux-2";
                generationParams = FLUX_2_PARAMS;
                generatedImagesURLs = await generateFlux2Image({
                    prompt: structuredPromptData,
                    numberOfImages,
                    imageSize,
                    useStructuredPrompt: true,
                });
            }
        } else {
            if (hasReferenceImage) {
                if (!referenceImageBase64) {
                    throw createError({ statusCode: 400, statusMessage: 'Bad Request' });
                }

                const referenceImageBuffer = Buffer.from(referenceImageBase64, 'base64');
                const assetId = randomUUID();
                const referenceImageStorageKey = generateAssetStorageKey(user.id, 'AVATAR', assetId);

                await storage.put(referenceImageStorageKey, referenceImageBuffer, 'image/png');
                await saveAssetToDB({
                    userId: user.id,
                    name: 'Reference Image',
                    type: 'OBJECT',
                    storageKey: referenceImageStorageKey,
                });

                const referenceImageURL = await storage.generatePresignedUrl(referenceImageStorageKey);
                console.log(' |- Optimized prompt: ', optimizedPrompt);
                model = requestedModel || "fal-ai/flux-pro/kontext";
                generationParams = FLUX_IMAGE_TO_IMAGE_PARAMS;
                generatedImagesURLs = await generateQuickImageToImage({
                    model: model,
                    prompt: optimizedPrompt,
                    numberOfImages,
                    resolution: imageSize,
                    referenceImageURL: referenceImageURL,
                });
            } else {
                model = requestedModel || "fal-ai/flux-2";
                generationParams = FLUX_IMAGE_PARAMS;
                console.log(' |- Using model: ', model);
                generatedImagesURLs = await generateQuickImage({
                    model: model,
                    prompt: optimizedPrompt,
                    numberOfImages,
                    resolution: imageSize,
                });
            }
        }

        if (FAL_MODEL_COSTS[model].per_image_cents) {
            capturePosthogServerEvent('image.quick-generation.generated', { 
                credits: numberOfImages * FAL_MODEL_COSTS[model].per_image_cents!,
                email: user.email,
            });
        }

        const savedImages: Image[] = [];
        for (const imageURL of generatedImagesURLs) {
            const imageId = randomUUID();
            const imageStorageKey = generateImageStorageKey(user.id, 'GENERATION', imageId);
            console.log(' |- Image storage key: ', imageStorageKey);

            const imageBuffer = await fetch(imageURL).then(res => res.arrayBuffer());
            await storage.put(imageStorageKey, Buffer.from(imageBuffer), 'image/png');

            console.log(' |- Image uploaded to storage');
            const image = await saveImageToDB({
                userId: user.id,
                imageId,
                storageKey: imageStorageKey,
                type: 'GENERATION',
                state: 'GENERATED',
                isPublic: false,
                imageMetadata: {
                    url: imageURL,
                },
                generationMetadata: {
                    prompt: useFlux2 ? JSON.stringify(structuredPromptData) : optimizedPrompt,
                    numberOfImages,
                    imageSize,
                    model,
                    useStructuredPrompt,
                },
            });
            savedImages.push(image);

            if (imageType === 'assets') {
                await saveAssetToDB({
                    userId: user.id,
                    name: prompt,
                    type: 'OBJECT',
                    storageKey: imageStorageKey,
                });
            }
        }

        await saveActivity({
            userId: user.id,
            targetType: "IMAGE",
            targetId: savedImages[0].id,
            eventType: "image.generated",
            payload: {
                ...generationParams,
            },
        });

        return savedImages;
        });
    } catch (error) {
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error;
        }
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});