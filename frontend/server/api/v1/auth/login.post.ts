import { eq } from "drizzle-orm";
import { verify } from "@node-rs/argon2";

import { db } from "~~/server/database";
import { userTable } from "~~/server/database/schemas/user.schema";
import { createSession, generateSessionToken } from "~~/server/utils/auth";
import { log } from "~~/server/utils/logger";

function isValidEmail(email: string): boolean {
    if (typeof email !== "string" || email.length > 254 || email.length < 3) {
        return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export default defineEventHandler(async (event) => {
    const { email, password } = await readBody(event);
    log.info("Attempted login");

    if (!isValidEmail(email)) {
        log.warn("Invalid email format");
        throw createError({
            message: "Invalid email",
            statusCode: 400
        });
    }

    if (typeof password !== "string" || password.length < 6 || password.length > 255) {
        log.warn("Invalid password format");
        throw createError({
            message: "Invalid password",
            statusCode: 400
        });
    }

    const existingUser = await db.query.userTable.findFirst({
        where: eq(userTable.email, email)
    });

    if (!existingUser) {
        // NOTE:
        // Returning immediately allows malicious actors to figure out valid usernames from response times,
        // allowing them to only focus on guessing passwords in brute-force attacks.
        // As a preventive measure, you may want to hash passwords even for invalid usernames.
        // However, valid usernames can be already be revealed with the signup page among other methods.
        // It will also be much more resource intensive.
        // Since protecting against this is non-trivial,
        // it is crucial your implementation is protected against brute-force attacks with login throttling etc.
        // If usernames are public, you may outright tell the user that the username is invalid.
        log.warn("Login attempt with non-existent email");
        throw createError({
            statusMessage: "Incorrect username or password",
            statusCode: 403
        });
    }

    // If the user is not active, return an error
    if (!existingUser.validationDate) {
        throw createError({
            statusMessage: "User is not active",
            statusCode: 403
        });
    }

    try {
        const validPassword = await verify(existingUser.hashedPassword, password, {
            memoryCost: 19456,
            timeCost: 6,
            outputLen: 48,
            parallelism: 1
        });
    
        if (!validPassword) {
            throw createError({
                statusMessage: "Incorrect username or password",
                statusCode: 400
            });
        }

        log.info("Login successful", { userId: existingUser.id });
    
        const token = generateSessionToken();
        const session = await createSession(token, existingUser.id);
        console.log("Session created", session.id);
    
        setCookie(event, "auth_session", session.id, {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 21
        });

        event.node.res.statusCode = 200;
        return {
            statusCode: 200,
            statusMessage: "Success :)"
        }
    } catch (error) {
        log.error("Login error", error, { email });
        throw createError({
            statusMessage: "Internal Server Error",
            statusCode: 500
        });
    }
});