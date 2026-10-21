import { and, eq, or } from "drizzle-orm";

import { db } from "~~/server/database";
import { avatarTable } from "~~/server/database/schemas/avatar.schema";
import { requireUserId } from "~~/server/utils/require-user";
import { getOwnedAvatarOrThrow } from "~~/server/services/avatar/owned-avatar";

export default defineEventHandler(async (event) => {
    const userId = requireUserId(event);

    const { avatarId } = getRouterParams(event);
    if (!avatarId) {
        throw createError({ statusCode: 400, statusMessage: "Bad Request" });
    }

    try {
        await getOwnedAvatarOrThrow(avatarId, userId);

        await db.update(avatarTable).set({
            deletedAt: new Date(),
        }).where(
            and(
                eq(avatarTable.id, avatarId),
                or(
                    eq(avatarTable.userId, userId),
                    eq(avatarTable.ownerId, userId),
                ),
            ),
        );

        return {
            message: "Avatar archived successfully",
        };
    } catch (error) {
        if (error && typeof error === "object" && "statusCode" in error) {
            throw error;
        }
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: "Internal server error" });
    }
});
