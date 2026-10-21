import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { storage } from "~~/server/storage";

import { db } from "~~/server/database";
import { imageTable } from "~~/server/database/schemas/image.schema";
import { optimizeFineGrainedEditionPrompt } from "~~/server/services/prompt/optimize-prompt";
import { ModelName, type ResolutionValue } from "~~/server/constants/models-db";
import { generateFineEditedImage, FLUX_2_FINE_EDIT_PARAMS } from "~~/server/services/fal/kontext-fine-edit-generation";
import { generateFlux2ImageToImage, FLUX_2_EDIT_PARAMS } from "~~/server/services/fal/generate-flux-2";
import { generateNanoBanana2ImageToImage, NANO_BANANA_2_PARAMS } from "~~/server/services/fal/generate-nano-banana-2";
import { generateQuickImageToImage } from "~~/server/services/fal/generate-quick-image";
import { getDefaultModel, resolveModel } from "~~/server/constants/models-db";
import { saveImageToDB } from "~~/server/services/image.service";
import { generateImageStorageKey } from "~~/server/storage/keys";
import { saveActivity } from "~~/server/services/activity/save-activity";
import { runChargedWork } from "~~/server/services/user/credits";
import { computeFineEditCost } from "~~/server/services/generation/generation-cost";
import { branchTable } from "~~/server/database/schemas/branch.schema";
import { type StructuredPrompt } from "~~/shared/generation/types";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({
            statusMessage: "Unauthorized",
            statusCode: 401
        });
    }

    const { 
        prompt, 
        imageId, 
        useStructuredPrompt = false, 
        structuredPromptData,
        model: requestedModel,
        modelOptions,
    } = await readBody<{
        prompt?: string;
        imageId: string;
        useStructuredPrompt?: boolean;
        structuredPromptData?: StructuredPrompt;
        model?: ModelName;
        modelOptions?: {
            resolution?: ResolutionValue;
            enableWebSearch?: boolean;
        };
    }>(event);
    
    const effectiveModel = resolveModel(requestedModel ?? getDefaultModel("fineEdit"), "fineEdit");
    const isNanoBanana2 = effectiveModel === 'fal-ai/nano-banana-2';
    const isGptImage2 = effectiveModel === 'gpt-image-2';
    if (useStructuredPrompt && isGptImage2) {
        throw createError({
            statusMessage: "Structured fine edit is not available with GPT Image 2. Choose Flux 2 or use a plain prompt.",
            statusCode: 400
        });
    }
    const hasValidPrompt = isNanoBanana2 || prompt || (useStructuredPrompt && structuredPromptData && (
        structuredPromptData.scene?.trim() || 
        structuredPromptData.subjects?.some((s: any) => s.description?.trim())
    ));
    if (!hasValidPrompt || !imageId) {
        throw createError({
            statusMessage: "Bad Request",
            statusCode: 400
        });
    }

    try {
        return await runChargedWork(user.id, computeFineEditCost({
            model: effectiveModel,
            modelOptions,
        }), async () => {
        console.log('--- Fine edit generation started...');
        // 1. Fetch the original image and check if the user owns it
        const originalImage = await db.query.imageTable.findFirst({
            where: and(
                eq(imageTable.id, imageId),
                eq(imageTable.userId, user.id),
            ),
        });
        if (!originalImage) {
            throw createError({
                statusMessage: "Image not found",
                statusCode: 404
            });
        };

        // 1.1. Fetch the children images and target branches
        const existingChildren = await db.query.imageTable.findMany({
            where: and(
                eq(imageTable.parentId, originalImage.id),
                eq(imageTable.userId, user.id),
            ),
        });
        let targetBranchId = originalImage.branchId;

        // 1.2. If there are children images we create another branch
        if (existingChildren.length > 0) {
            if (!originalImage.branchId) {
                const defaultBranch = await db.insert(branchTable).values({
                    name: 'Main Branch',
                    rootId: originalImage.rootId || originalImage.id,
                    headImageId: originalImage.id,
                    default: true,
                }).returning();

                // 1.3. Update existing images in main timeline to belong to default branch
                await db.update(imageTable)
                    .set({ branchId: defaultBranch[0].id })
                    .where(eq(imageTable.rootId, originalImage.rootId || originalImage.id));
            };

            // 1.4. Create new branch
            const newBranch = await db.insert(branchTable).values({
                name: `branch-${Date.now()}`,
                rootId: originalImage.id,
                headImageId: null,
                default: false,
            }).returning();
            
            targetBranchId = newBranch[0].id;
        };

        const originalImageUrl = await storage.generatePresignedUrl(originalImage.storageKey);
        let fineEditedImageURLs: string[];
        let model: ModelName;
        let generationParams: Record<string, unknown>;
        let finalPrompt: string | StructuredPrompt;

        if (isNanoBanana2) {
            console.log(' |- Using Nano Banana 2 for fine edit');
            model = "fal-ai/nano-banana-2";
            generationParams = { ...NANO_BANANA_2_PARAMS, resolution: modelOptions?.resolution, enableWebSearch: modelOptions?.enableWebSearch };
            const editPrompt = (prompt || '').trim() || 'Edit and improve this image';
            finalPrompt = editPrompt;
            fineEditedImageURLs = await generateNanoBanana2ImageToImage({
                prompt: editPrompt,
                numberOfImages: 1,
                resolution: modelOptions?.resolution ?? '1K',
                enableWebSearch: modelOptions?.enableWebSearch ?? false,
                referenceImageURLs: [originalImageUrl],
            });
            console.log(' |- Fine edited image generated with Nano Banana 2');
        } else if (useStructuredPrompt && structuredPromptData) {
            console.log(' |- Using Flux-2 with structured prompt for fine edit');
            model = "fal-ai/flux-2/edit";
            generationParams = FLUX_2_EDIT_PARAMS;
            finalPrompt = structuredPromptData as StructuredPrompt;
            fineEditedImageURLs = await generateFlux2ImageToImage({
                prompt: structuredPromptData as StructuredPrompt,
                numberOfImages: 1,
                imageSize: "landscape_4_3",
                referenceImageURL: originalImageUrl,
                useStructuredPrompt: true,
            });
            console.log(' |- Fine edited image generated with structured prompt');
        } else {
            let fineEditDetailPrompt: string = prompt || '';
            const generatedFineEditDetailPrompt = await optimizeFineGrainedEditionPrompt(prompt || '', originalImageUrl);
            if (generatedFineEditDetailPrompt) {
                fineEditDetailPrompt = generatedFineEditDetailPrompt;
            }
            console.log(' |- Fine edit detail prompt generated');

            if (isGptImage2) {
                model = "gpt-image-2";
                generationParams = { quality: "medium" as const };
                finalPrompt = fineEditDetailPrompt;
                fineEditedImageURLs = await generateQuickImageToImage({
                    model: "gpt-image-2",
                    prompt: fineEditDetailPrompt,
                    numberOfImages: 1,
                    resolution: "16:9",
                    referenceImageURL: originalImageUrl,
                    imageQuality: "medium",
                });
                console.log(' |- Fine edited image generated with GPT Image 2');
            } else {
                model = "fal-ai/flux-2/edit";
                generationParams = FLUX_2_FINE_EDIT_PARAMS;
                finalPrompt = fineEditDetailPrompt;
                fineEditedImageURLs = await generateFineEditedImage({
                    model: model,
                    prompt: fineEditDetailPrompt,
                    numberOfImages: 1,
                    imageSize: "landscape_4_3",
                    referenceImageURL: originalImageUrl,
                });
                console.log(' |- Fine edited image generated');
            }
        }

        // 4. Record the activity and the new image in the database, and save it into the storage
        const newImageId = randomUUID();
        const newImageStorageKey = generateImageStorageKey(user.id, 'GENERATION', newImageId);
        const newImageBuffer = await fetch(fineEditedImageURLs[0]).then(res => res.arrayBuffer());
        await storage.put(newImageStorageKey, Buffer.from(newImageBuffer), 'image/png');
        const savedImage = await saveImageToDB({
            userId: user.id,
            imageId: newImageId,
            storageKey: newImageStorageKey,
            parentId: originalImage.id,
            rootId: originalImage.rootId ? originalImage.rootId : originalImage.id,
            projectId: originalImage.projectId ? originalImage.projectId : undefined,
            branchId: targetBranchId ? targetBranchId : undefined,
            toolId: originalImage.toolId ? originalImage.toolId : undefined,
            type: "GENERATION",
            state: "GENERATED",
            imageMetadata: {
                url: fineEditedImageURLs[0],
            },
            generationMetadata: {
                prompt: typeof finalPrompt === 'string' ? finalPrompt : JSON.stringify(finalPrompt),
                model,
                ...generationParams,
            },
            isPublic: false,
        });

        // 4.1. Update the branch head image
        if (targetBranchId) {
            await db.update(branchTable)
                .set({ headImageId: savedImage.id })
                .where(eq(branchTable.id, targetBranchId));
        }

        await saveActivity({
            userId: user.id,
            targetType: "IMAGE",
            targetId: savedImage.id,
            eventType: "image.fine-edit.generated",
            payload: {
                ...generationParams,
            },
        });
        
        // 5. Return the new image
        console.log(" |- Fine edit generation completed successfully 💜")
        return savedImage;
        });
    } catch (error) {
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error;
        }
        console.error("-x- Error fine editing image", error);
        throw error;
    }
});