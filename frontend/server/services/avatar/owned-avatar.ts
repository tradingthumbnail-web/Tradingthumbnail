import { and, eq, or } from "drizzle-orm";

import { db } from "~~/server/database";
import { avatarTable } from "~~/server/database/schemas/avatar.schema";

export async function getOwnedAvatarOrThrow(avatarId: string, userId: string) {
    const avatar = await db.query.avatarTable.findFirst({
        where: and(
            eq(avatarTable.id, avatarId),
            or(
                eq(avatarTable.userId, userId),
                eq(avatarTable.ownerId, userId),
            ),
        ),
    });
    if (!avatar) {
        throw createError({ statusCode: 404, statusMessage: "Avatar not found" });
    }
    return avatar;
}
