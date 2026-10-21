import { hash } from "@node-rs/argon2";
import { randomUUID } from "crypto";
import { eq, or } from "drizzle-orm";

import { db } from "~~/server/database";
import { userTable } from "~~/server/database/schemas/user.schema";
import { resetTokensTable } from "~~/server/database/schemas/reset-token.schema";
import { sendVerificationEmail } from "~~/server/services/emails/verification-email";
import { assertSignupEnabled } from "~~/server/utils/signup-gate";
import {
    EMAIL_VERIFICATION_TTL_MS,
    generateSecretToken,
    verifyTokenHash,
} from "~~/server/utils/secure-token";

export default defineEventHandler(async (event) => {
    const {
        name,
        email,
        password,
        confirmPassword,
        agree,
        userLocale
    } = await readBody(event);

    if (!agree) {
        throw createError({
            statusMessage: "You must agree to the terms of service",
            statusCode: 400
        });
    };

    if (!password || !confirmPassword || (password !== confirmPassword)) {
        throw createError({
            statusMessage: "Password and confirm password are required and must match",
            statusCode: 400
        });
    };
    

    const config = useRuntimeConfig(event);
    assertSignupEnabled(config.public.enableSignIn);

    if (typeof email !== "string" || email.length < 8 || email.length > 60) {
        throw createError({
            statusMessage: "Invalid email",
            statusCode: 400
        });
    }

    if (typeof password !== "string" || password.length < 3 || password.length > 255) {
        throw createError({
            statusMessage: "Invalid password",
            statusCode: 400
        });
    }

    const userId = randomUUID();

    const passwordHash = await hash(password, {
        memoryCost: 19456,
        timeCost: 6,
        outputLen: 48,
        parallelism: 1
    });

    try {
        const existingUser = await db.query.userTable.findFirst({
            where: or(
                eq(userTable.email, email),
                eq(userTable.username, name)
            )
        });
        if (existingUser) {
            throw createError({
                statusMessage: "User email or username already exists",
                statusCode: 409
            });
        };

        const newUser = await db.insert(userTable).values({
            id: userId,
            name: name,
            username: name,
            email: email,
            hashedPassword: passwordHash,
            validationDate: null,
        }).returning();

        console.log(" |- This is the newUser", newUser[0].id);

        const rawToken = generateSecretToken();
        await db.insert(resetTokensTable).values({
            tokenHash: verifyTokenHash(rawToken),
            userId: newUser[0].id,
            expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
        });
        const verificationLink = `${config.public.appUrl}/validate-email?token=${encodeURIComponent(rawToken)}`;

        try {
            await sendVerificationEmail(email, verificationLink, name, userLocale)
        } catch (error) {
            console.error("Error sending verification email", error);

            // Remove the user from the database
            await db.delete(userTable).where(eq(userTable.id, newUser[0].id));

            throw createError({
                statusMessage: "Error sending verification email",
                statusCode: 500
            });
        }

        return newUser[0];

    } catch (error) {
        if (error && typeof error === "object" && "statusCode" in error) {
            throw error;
        }
        console.error("Error signing up", error);
        throw createError({
            statusMessage: "Error signing up",
            statusCode: 500
        });
    }
});
