import { and, eq } from "drizzle-orm";

import { db } from "~~/server/database";
import { activityTable } from "~~/server/database/schemas/activity.schema";
import { imageTable } from "~~/server/database/schemas/image.schema";

import { storage } from "~~/server/storage";
import { requireUserId } from "~~/server/utils/require-user";
import { getOwnedImageOrThrow } from "~~/server/services/image.service";

export default defineEventHandler(async (event) => {
    const userId = requireUserId(event);

    const { imageId } = getRouterParams(event);
    if (!imageId) {
        throw createError({ statusCode: 400, statusMessage: "Bad Request" });
    }

    try {
        const image = await getOwnedImageOrThrow(imageId, userId);

        await db.transaction(async (trx) => {
            await trx.delete(imageTable).where(
                and(
                    eq(imageTable.id, imageId),
                    eq(imageTable.userId, userId),
                ),
            );
            await trx.delete(activityTable).where(eq(activityTable.targetId, imageId));
        });

        await storage.delete(image.storageKey);
        await storage.deleteAllFilesInFolder(image.storageKey);

        return {
            message: "Image deleted successfully",
        };
    } catch (error) {
        if (error && typeof error === "object" && "statusCode" in error) {
            throw error;
        }
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: "Internal server error" });
    }
});
