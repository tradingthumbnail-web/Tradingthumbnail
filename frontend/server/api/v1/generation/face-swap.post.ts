import { randomUUID } from "crypto";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "~~/server/database";
import { assetTable } from "~~/server/database/schemas/assets.schema";
import { avatarTable } from "~~/server/database/schemas/avatar.schema";

import { storage } from "~~/server/storage";
import { generateImageStorageKey, generateAvatarTrainingImageKey } from "~~/server/storage/keys";
import { getOwnedImageOrThrow, saveImageToDB } from "~~/server/services/image.service";
import { generateFaceSwap } from "~~/server/services/fal/face-swap";
import { runChargedWork } from "~~/server/services/user/credits";
import { FIXED_GENERATION_COSTS } from "~~/server/services/generation/generation-cost";
import { requireUserId } from "~~/server/utils/require-user";

type FaceSwapInput = {
    sourceAssetId?: string | null;
    sourceAvatarId?: string | null;
    sourceAvatarImageIndex?: number | null;
    sourceImageBase64?: string | null;
    targetImageId?: string | null;
    targetAssetId?: string | null;
    targetImageBase64?: string | null;
    enableOcclusionPrevention?: boolean | null;
};

const MODEL_ID = "half-moon-ai/ai-face-swap/faceswapimage";

function getDataUrlContentType(dataUrl: string): string {
    const match = dataUrl.match(/^data:(.*?);base64,/);
    return match?.[1] || 'image/png';
}

async function uploadDataUrl({
    userId,
    dataUrl,
    prefix,
}: {
    userId: string;
    dataUrl: string;
    prefix: string;
}): Promise<string> {
    const contentType = getDataUrlContentType(dataUrl);
    const base64Data = dataUrl.replace(/^data:.*?;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const storageKey = `${userId}/${prefix}-${randomUUID()}`;
    await storage.put(storageKey, buffer, contentType);
    return storage.generatePresignedUrl(storageKey);
}

async function resolveAssetUrl(userId: string, assetId: string): Promise<string> {
    const asset = await db.query.assetTable.findFirst({
        where: and(
            eq(assetTable.id, assetId),
            eq(assetTable.userId, userId),
            isNull(assetTable.deletedAt),
        ),
    });
    if (!asset) {
        throw createError({ statusCode: 404, statusMessage: 'Asset not found' });
    }
    return storage.generatePresignedUrl(asset.storageKey);
}

async function resolveAvatarTrainingImageUrl(userId: string, avatarId: string, imageIndex: number): Promise<string> {
    const avatar = await db.query.avatarTable.findFirst({
        where: and(
            eq(avatarTable.id, avatarId),
            eq(avatarTable.userId, userId),
            isNull(avatarTable.deletedAt),
        ),
    });
    if (!avatar) {
        throw createError({ statusCode: 404, statusMessage: 'Avatar not found' });
    }
    const storageKey = generateAvatarTrainingImageKey(userId, avatar.id, String(imageIndex));
    return storage.generatePresignedUrl(storageKey);
}

export default defineEventHandler(async (event) => {
    const userId = requireUserId(event);

    const {
        sourceAssetId,
        sourceAvatarId,
        sourceAvatarImageIndex,
        sourceImageBase64,
        targetImageId,
        targetAssetId,
        targetImageBase64,
        enableOcclusionPrevention,
    } = await readBody<FaceSwapInput>(event);

    const hasSource = sourceAssetId || (sourceAvatarId && sourceAvatarImageIndex !== undefined && sourceAvatarImageIndex !== null) || sourceImageBase64;
    if (!targetImageId || !hasSource) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request' });
    }

    try {
        const targetImage = await getOwnedImageOrThrow(targetImageId, userId);

        return await runChargedWork(userId, FIXED_GENERATION_COSTS.faceSwap, async () => {
            let sourceFaceUrl: string;
            if (sourceImageBase64) {
                sourceFaceUrl = await uploadDataUrl({ userId, dataUrl: sourceImageBase64, prefix: 'face-swap-source' });
            } else if (sourceAvatarId && sourceAvatarImageIndex !== undefined && sourceAvatarImageIndex !== null) {
                sourceFaceUrl = await resolveAvatarTrainingImageUrl(userId, sourceAvatarId, sourceAvatarImageIndex);
            } else {
                sourceFaceUrl = await resolveAssetUrl(userId, sourceAssetId as string);
            }

            let targetImageUrl = '';
            if (targetImageBase64) {
                targetImageUrl = await uploadDataUrl({ userId, dataUrl: targetImageBase64, prefix: 'face-swap-target' });
            } else if (targetAssetId) {
                targetImageUrl = await resolveAssetUrl(userId, targetAssetId);
            } else {
                targetImageUrl = await storage.generatePresignedUrl(targetImage.storageKey);
            }

            const generatedImageBuffer = await generateFaceSwap({
                model: MODEL_ID,
                sourceFaceUrl,
                targetImageUrl,
                enableOcclusionPrevention: Boolean(enableOcclusionPrevention),
            });

            const newImageId = randomUUID();
            const imageType = targetImage.type || 'GENERATION';
            const newImageStorageKey = generateImageStorageKey(userId, imageType, newImageId);
            await storage.put(newImageStorageKey, generatedImageBuffer, 'image/png');

            return saveImageToDB({
                userId,
                imageId: newImageId,
                storageKey: newImageStorageKey,
                parentId: targetImage.id,
                rootId: targetImage.rootId ? targetImage.rootId : targetImage.id,
                projectId: targetImage.projectId ? targetImage.projectId : undefined,
                branchId: targetImage.branchId ? targetImage.branchId : undefined,
                toolId: targetImage.toolId ? targetImage.toolId : undefined,
                type: imageType,
                state: 'GENERATED',
                isPublic: false,
                imageMetadata: {
                    url: newImageStorageKey,
                },
                generationMetadata: {
                    model: MODEL_ID,
                    sourceAssetId,
                    targetAssetId,
                },
            });
        });
    } catch (error) {
        console.error(error);
        // Re-throw H3 errors as-is to preserve status codes
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error;
        }
        throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
    }
});