import { and, eq, gt, isNull } from "drizzle-orm";

import { db } from "~~/server/database";
import { resetTokensTable } from "~~/server/database/schemas/reset-token.schema";
import { userTable } from "~~/server/database/schemas/user.schema";
import { verifyTokenHash } from "~~/server/utils/secure-token";

export default defineEventHandler(async (event) => {
    const { token } = await readBody(event);

    if (!token || typeof token !== "string") {
        throw createError({
            statusCode: 400,
            statusMessage: "Token is required",
        });
    }

    try {
        const tokenEntry = await db.query.resetTokensTable.findFirst({
            where: and(
                eq(resetTokensTable.tokenHash, verifyTokenHash(token)),
                gt(resetTokensTable.expiresAt, new Date()),
            ),
        });

        if (!tokenEntry) {
            throw createError({
                statusCode: 400,
                statusMessage: "Invalid or expired token",
            });
        }

        const user = await db.query.userTable.findFirst({
            where: and(
                eq(userTable.id, tokenEntry.userId),
                isNull(userTable.validationDate),
            ),
        });

        if (!user) {
            throw createError({
                statusCode: 400,
                statusMessage: "Invalid or expired token",
            });
        }

        await db.update(userTable).set({
            validationDate: new Date(),
        }).where(eq(userTable.id, user.id));

        await db.delete(resetTokensTable).where(eq(resetTokensTable.tokenHash, tokenEntry.tokenHash));

        return {
            success: true,
        };
    } catch (error) {
        if (error && typeof error === "object" && "statusCode" in error) {
            throw error;
        }
        throw createError({
            statusCode: 500,
            statusMessage: "Error validating email",
        });
    }
});
