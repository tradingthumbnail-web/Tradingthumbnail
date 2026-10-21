import { and, eq } from "drizzle-orm";

import { db } from "~~/server/database";
import { imageTable } from "~~/server/database/schemas/image.schema";
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

        await db.update(imageTable).set({
            imageMetadata: {
                ...image.imageMetadata,
                isFavorite: !image.imageMetadata.isFavorite,
            },
        }).where(
            and(
                eq(imageTable.id, imageId),
                eq(imageTable.userId, userId),
            ),
        );

        event.node.res.statusCode = 204;
    } catch (error) {
        if (error && typeof error === "object" && "statusCode" in error) {
            throw error;
        }
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: "Internal Server Error" });
    }
});
