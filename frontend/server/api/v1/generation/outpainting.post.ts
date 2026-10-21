import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import sharp from "sharp";

import { db } from "~~/server/database";
import { imageTable } from "~~/server/database/schemas/image.schema";

import { storage } from "~~/server/storage";
import { generateImageStorageKey } from "~~/server/storage/keys";

import { generateOutpaintingMask } from "~~/server/services/image/generate-outpainting-mask";
import { generateOutpaintingImage, FLUX_LORA_FILL_PARAMS } from "~~/server/services/fal/outpainting";
import { saveImageToDB } from "~~/server/services/image.service";
import { saveActivity } from "~~/server/services/activity/save-activity";
import { runChargedWork } from "~~/server/services/user/credits";
import { FIXED_GENERATION_COSTS } from "~~/server/services/generation/generation-cost";

interface OutpaintingInputForms {
    originalImageId: string;
    dimensions: {
        width: number;
        height: number;
    };
    position: {
        x: number;
        y: number;
    };
    image: {
        width: number;
        height: number;
    };
    scale: number;
};

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const { originalImageId, dimensions, position, scale, image }: OutpaintingInputForms = await readBody(event);
    if (!originalImageId || !dimensions || !position || !scale || !image || scale < 0.05 || scale > 5) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request' });
    }

    try {
        return await runChargedWork(user.id, FIXED_GENERATION_COSTS.outpainting, async () => {
        // 1. Check and get the original image
        const originalImage = await db.query.imageTable.findFirst({
            where: and(
                eq(imageTable.id, originalImageId),
                eq(imageTable.userId, user.id),
            ),
        });
        if (!originalImage) {
            throw createError({ statusCode: 404, statusMessage: 'Image not found' });
        };

        // 1.1. Get the original image buffer and create canvas with image positioned
        console.log(" |- Creating canvas with positioned image...");
        const originalImageBuffer = await storage.get(originalImage.storageKey);
        const originalImageSharp = sharp(originalImageBuffer);
        
        const canvasWidth = Math.max(1, Math.round(dimensions.width));
        const canvasHeight = Math.max(1, Math.round(dimensions.height));
        
        // Calculate scaled dimensions
        const scaledWidth = Math.max(1, Math.round(image.width * scale));
        const scaledHeight = Math.max(1, Math.round(image.height * scale));
        
        // Resize original image to scaled size
        const scaledImageBuffer = await originalImageSharp
            .resize(scaledWidth, scaledHeight, { fit: 'fill' })
            .toBuffer();
        
        // Calculate position (Fabric uses center origin, so convert to top-left)
        const imageLeft = Math.round(position.x - scaledWidth / 2);
        const imageTop = Math.round(position.y - scaledHeight / 2);

        // Ensure the image fits within the canvas by cropping the overlay if needed
        const cropLeft = Math.max(0, -imageLeft);
        const cropTop = Math.max(0, -imageTop);
        const cropWidth = Math.min(scaledWidth - cropLeft, canvasWidth - Math.max(0, imageLeft));
        const cropHeight = Math.min(scaledHeight - cropTop, canvasHeight - Math.max(0, imageTop));

        if (cropWidth <= 0 || cropHeight <= 0) {
            throw createError({ statusCode: 400, statusMessage: 'Image is outside the canvas bounds' });
        }

        const overlayBuffer = await sharp(scaledImageBuffer)
            .extract({
                left: cropLeft,
                top: cropTop,
                width: cropWidth,
                height: cropHeight,
            })
            .toBuffer();

        const canvasLeft = Math.max(0, imageLeft + cropLeft);
        const canvasTop = Math.max(0, imageTop + cropTop);
        
        // Create black canvas and composite the scaled image onto it
        const canvasImageBuffer = await sharp({
            create: {
                width: canvasWidth,
                height: canvasHeight,
                channels: 3,
                background: { r: 0, g: 0, b: 0 },
            },
        } as any)
            .composite([{
                input: overlayBuffer,
                left: canvasLeft,
                top: canvasTop,
            }])
            .png()
            .toBuffer();
        
        const canvasImageStorageKey = `${user.id}/canvas-outpainting.png`;
        await storage.put(canvasImageStorageKey, canvasImageBuffer, 'image/png');
        const canvasImagePresignedUrl = await storage.generatePresignedUrl(canvasImageStorageKey);

        // 2. Generate the mask of the original image based on the desired output dimensions of the canvas
        const mask = await generateOutpaintingMask({ dimensions, position, scale, image });
        // 2.1. Upload the mask to the storage and get the presigned URL
        const maskStorageKey = `${user.id}/mask.png`;
        await storage.put(maskStorageKey, mask, 'image/png');
        const maskPresignedUrl = await storage.generatePresignedUrl(maskStorageKey);

        // 3. Get an image description for the outpainting process
        const prompt = 'Extend the image naturally, maintain consistency';

        // 4. Generate the outpainting image
        const generatedImageBuffer = await generateOutpaintingImage({
            model: "fal-ai/flux-lora-fill",
            prompt: prompt,
            imageUrl: canvasImagePresignedUrl,
            maskUrl: maskPresignedUrl,
        });

        // 5. Save the image to the database and the storage
        const newImageId = randomUUID();
        const newImageStorageKey = generateImageStorageKey(user.id, 'GENERATION', newImageId);
        await storage.put(newImageStorageKey, generatedImageBuffer, 'image/png');

        // 5.1. Save the image to the database and the storage
        const savedImage = await saveImageToDB({
            userId: user.id,
            imageId: newImageId,
            storageKey: newImageStorageKey,
            type: 'GENERATION',
            state: 'GENERATED',
            isPublic: false,
            parentId: originalImage.id,
            rootId: originalImage.rootId ? originalImage.rootId : originalImage.id,
            projectId: originalImage.projectId ? originalImage.projectId : undefined,
            branchId: originalImage.branchId ? originalImage.branchId : undefined,
            toolId: originalImage.toolId ? originalImage.toolId : undefined,
            imageMetadata: {
                url: newImageStorageKey,
            },
            generationMetadata: {
                prompt: prompt,
                ...FLUX_LORA_FILL_PARAMS,
            },
        });

        // 5.2. Save the activity
        await saveActivity({
            userId: user.id,
            targetType: "IMAGE",
            targetId: savedImage.id,
            eventType: "image.outpainting.generated",
            payload: {
                ...FLUX_LORA_FILL_PARAMS,
            },
        });
        
        // 5. Return the image
        console.log(" |- Outpainting generation completed successfully 💜")
        return savedImage;
        });
    } catch (error) {
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error;
        }
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
    }
});