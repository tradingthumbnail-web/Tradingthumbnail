import { eq } from "drizzle-orm";
import { OAuth2Client } from "google-auth-library";

import { db } from "~~/server/database";
import { userTable, type InsertUser } from "~~/server/database/schemas/user.schema";
import { generateSessionToken, createSession, invalidateSessionByUserId } from "~~/server/utils/auth";
import { assertSignupEnabled } from "~~/server/utils/signup-gate";

function normalizeUsername(value: string) {
    const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "");
    return normalized.length > 0 ? normalized : "user";
}

async function generateUniqueUsername(base: string) {
    const normalizedBase = normalizeUsername(base);

    for (let attempt = 0; attempt < 10; attempt += 1) {
        const candidate = attempt === 0 ? normalizedBase : `${normalizedBase}-${crypto.randomUUID().slice(0, 8)}`;
        const existing = await db.query.userTable.findFirst({
            where: eq(userTable.username, candidate)
        });
        if (!existing) {
            return candidate;
        }
    }

    return `${normalizedBase}-${crypto.randomUUID().slice(0, 8)}`;
}

export default defineEventHandler(async (event) => {
    const { token }: { token: string } = await readBody(event);
    if (!token) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Token is required',
        });
    };

    const config = useRuntimeConfig(event);
    const clientId = config.googleClientId ?? process.env.NUXT_GOOGLE_CLIENT_ID;
    const clientSecret = config.googleSecretId ?? process.env.NUXT_GOOGLE_SECRET_ID;
    const redirectUrl = `${config.public.appUrl}`
    if (!clientId || !clientSecret) {
        console.error("Client ID or Client Secret is not set");
        throw createError({
            statusCode: 500,
            statusMessage: 'Client ID or Client Secret is not set',
        });
    };

    try {
        // Initialize the OAuth2Client
        let client: OAuth2Client;
        try {
            client = new OAuth2Client(
                clientId,
                clientSecret,
                redirectUrl,
            );
        } catch (error) {
            console.error("Error initializing Google OAuth2Client", error);
            throw createError({
                statusCode: 500,
                statusMessage: 'Error initializing Google OAuth2Client',
            });
        };

        // Get the ticket from the token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: clientId,
        }).catch((error) => {
            console.error("Error verifying Google token", error);
            throw createError({
                statusCode: 400,
                statusMessage: 'Error verifying Google token',
            });
        });

        const payload = ticket.getPayload();
        if (!payload) {
            console.error("Error verifying Google token");
            throw createError({
                statusCode: 400,
                statusMessage: 'Error verifying Google token',
            });
        };
        
        // Once we have the payload, we can create the user
        // 1. Check if the user already exists
        const userEmail = payload.email;
        const userId = crypto.randomUUID();
        if (!userEmail) {
            throw createError({
                statusCode: 400,
                statusMessage: 'User email is not valid',
            });
        };

        const existingUser = await db.query.userTable.findFirst({
            where: eq(userTable.email, userEmail as string),
        });
        if (existingUser) {
            // If user already exists, we invalidate the sessions of the user and create a new one, and let it i
            await invalidateSessionByUserId(existingUser.id)
                .catch((error) => {
                    console.error("Error invalidating sessions", error);
                    throw createError({
                        statusCode: 500,
                        statusMessage: 'Error invalidating sessions',
                    });
                });

            // We generate a new session and we let the user in
            const sessionToken = generateSessionToken();
            const session = await createSession(sessionToken, existingUser.id);

            // 5. Add the session token to the client
            setCookie(event, "auth_session", session.id, {
                secure: process.env.NODE_ENV === "production",
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 21
            });

            event.node.res.statusCode = 200;
            return { message: "Welcome :)" };
        };

        assertSignupEnabled(config.public.enableSignIn);

        // 2. Create the user
        const usernameBase = payload.given_name || payload.name || userEmail.split("@")[0] || "user";
        const uniqueUsername = await generateUniqueUsername(usernameBase);

        const user = {
            id: userId,
            email: userEmail,
            name: payload.name as string,
            username: uniqueUsername,
            credit: 20,
            isActive: true,
            isValidated: true,
            hashedPassword: 'google-signin',
            subscriptionData: {
                subscriptionId: null,
                firstSubscription: true
            }
        } as InsertUser;

        // 3. Insert the user into the database
        const newUser = await db.insert(userTable).values(user).returning();
        if (!newUser) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Error creating user',
            });
        };

        // 4. Generate the session
        const sessionToken = generateSessionToken();
        const session = await createSession(sessionToken, userId);

        // 5. Add the session token to the client
        setCookie(event, "auth_session", session.id, {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 24 * 21
        });

        event.node.res.statusCode = 200;

        // 5. Return the session token
        return { message: "Welcome :)" };
    } catch (error) {
        if (error && typeof error === "object" && "statusCode" in error) {
            throw error;
        }
        console.error("Error validating Google token", error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Error validating Google token',
        });
    }
});