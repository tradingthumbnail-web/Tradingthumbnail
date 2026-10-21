import { and, eq, gt } from "drizzle-orm";
import { hash } from "@node-rs/argon2";

import { db } from "~~/server/database";
import { resetTokensTable } from "~~/server/database/schemas/reset-token.schema";
import { userTable } from "~~/server/database/schemas/user.schema";
import { resetTokenHash } from "~~/server/utils/secure-token";

export default defineEventHandler(async (event) => {
    const { token, password } = await readBody(event);

    if (!token || typeof token !== "string" || typeof password !== "string" || password.length < 6) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid token or password",
        });
    }

    try {
        const tokenEntry = await db.query.resetTokensTable.findFirst({
            where: and(
                eq(resetTokensTable.tokenHash, resetTokenHash(token)),
                gt(resetTokensTable.expiresAt, new Date()),
            ),
            with: {
                user: true,
            },
        });

        if (!tokenEntry?.user) {
            throw createError({
                statusCode: 400,
                statusMessage: "Invalid or expired token",
            });
        }

        const passwordHash = await hash(password, {
            memoryCost: 19456,
            timeCost: 6,
            outputLen: 48,
            parallelism: 1,
        });
        await db.update(userTable).set({ hashedPassword: passwordHash }).where(eq(userTable.id, tokenEntry.user.id));
        await db.delete(resetTokensTable).where(eq(resetTokensTable.tokenHash, tokenEntry.tokenHash));

        return {
            statusCode: 200,
            statusMessage: "Password changed successfully",
        };
    } catch (error) {
        if (error && typeof error === "object" && "statusCode" in error) {
            throw error;
        }
        throw createError({
            statusCode: 500,
            statusMessage: "Error changing password",
        });
    }
});
