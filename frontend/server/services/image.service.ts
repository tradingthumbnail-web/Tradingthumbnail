import { and, eq } from "drizzle-orm";

import { type ImageType } from "~~/shared/enums/image-types";

import { db } from "~~/server/database";
import { ImageState, imageTable } from "~~/server/database/schemas/image.schema";

export const saveImageToDB = async ({
    imageId,
    userId,
    storageKey,
    type,
    state,
    isPublic = false,
    imageMetadata,
    generationMetadata,
    toolId,
    projectId,
    branchId,
    rootId,
    parentId,
    depth,
    ordinal,
}: {
    imageId: string;
    userId: string;
    storageKey: string;
    type: ImageType;
    state: ImageState;
    isPublic?: boolean;
    imageMetadata?: Record<string, any>;
    generationMetadata?: Record<string, any>;
    toolId?: string;
    projectId?: string;
    branchId?: string;
    rootId?: string;
    parentId?: string;
    depth?: number;
    ordinal?: number;
}) => {
    try {
        const [image] = await db.insert(imageTable).values({
            id: imageId,
            userId,
            storageKey,
            type,
            state,
            isPublic,
            imageMetadata,
            generationMetadata,
            toolId,
            projectId,
            branchId,
            rootId,
            parentId,
            depth,
            ordinal,
        }).returning();

        return image;
    } catch (error) {
        console.error("-x- Error saving image to database", error);
        throw error;
    }
}

export const getImageById = async (imageId: string) => {
    try {
        const image = await db.query.imageTable.findFirst({
            where: eq(imageTable.id, imageId),
        });
        return image;
    } catch (error) {
        console.error("-x- Error getting image by id", error);
        throw error;
    }
}

export const getOwnedImage = async (imageId: string, userId: string) => {
    return db.query.imageTable.findFirst({
        where: and(
            eq(imageTable.id, imageId),
            eq(imageTable.userId, userId),
        ),
    });
}

export const getOwnedImageOrThrow = async (imageId: string, userId: string) => {
    const image = await getOwnedImage(imageId, userId);
    if (!image) {
        throw createError({ statusCode: 404, statusMessage: "Image not found" });
    }
    return image;
}