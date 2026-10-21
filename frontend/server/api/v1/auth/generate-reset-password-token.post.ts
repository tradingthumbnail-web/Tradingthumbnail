import { eq } from "drizzle-orm";

import { db } from "~~/server/database";
import { resetTokensTable } from "~~/server/database/schemas/reset-token.schema";
import { userTable } from "~~/server/database/schemas/user.schema";

import { sendResetPasswordEmail } from "~~/server/services/emails/reset-password-email";
import {
    PASSWORD_RESET_TTL_MS,
    generateSecretToken,
    resetTokenHash,
} from "~~/server/utils/secure-token";

export default defineEventHandler(async (event) => {
    const { email } = await readBody(event);
    const config = useRuntimeConfig(event);

    try {
        const user = await db.query.userTable.findFirst({
            where: eq(userTable.email, email),
        });

        if (user) {
            await db.delete(resetTokensTable).where(eq(resetTokensTable.userId, user.id));

            const rawToken = generateSecretToken();
            await db.insert(resetTokensTable).values({
                tokenHash: resetTokenHash(rawToken),
                userId: user.id,
                expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
            });

            const resetLink = `${config.public.appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
            await sendResetPasswordEmail(user.email, user.name, user.locale || "en", resetLink);
        }

        return {
            message: "If an account exists for that email, a reset link has been sent",
        };
    } catch (error) {
        if (error && typeof error === "object" && "statusCode" in error) {
            throw error;
        }
        console.error("Error sending reset password email", error);
        throw createError({ statusCode: 500, statusMessage: "Internal server error" });
    }
});
