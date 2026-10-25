import { hash } from "@node-rs/argon2";
import { randomBytes, createHash, randomUUID } from "node:crypto";
import { and, eq, ne } from "drizzle-orm";
import { OAuth2Client } from "google-auth-library";

import { db } from "~~/server/database";
import { userTable, type InsertUser } from "~~/server/database/schemas/user.schema";
import { createSession, generateSessionToken, invalidateSessionByUserId } from "~~/server/utils/auth";
import { assertSignupEnabled } from "~~/server/utils/signup-gate";
import { sanitizeInternalRedirect } from "~~/shared/clicklab/safe-redirect";

type GoogleOAuthConfig = {
    clientId: string;
    clientSecret: string;
};

export type GoogleOAuthFlowCookie = {
    state: string;
    codeVerifier: string;
    redirectTo: string;
    createdAt: number;
};

export type GoogleIdentity = {
    email: string;
    name: string;
    givenName: string;
};

const GOOGLE_OAUTH_FLOW_COOKIE = "google_oauth_flow";
const FLOW_TTL_SECONDS = 60 * 10;
const ALLOWED_ISSUERS = new Set(["https://accounts.google.com", "accounts.google.com"]);

function normalizeUsername(value: string) {
    const normalized = value.toLowerCase().replace(/[^a-z0-9_-]+/g, "");
    return normalized.length > 0 ? normalized.slice(0, 60) : "user";
}

async function generateUniqueUsername(base: string) {
    const normalizedBase = normalizeUsername(base);

    for (let attempt = 0; attempt < 10; attempt += 1) {
        const candidate = attempt === 0 ? normalizedBase : `${normalizedBase}-${randomUUID().slice(0, 8)}`;
        const existing = await db.query.userTable.findFirst({
            columns: { id: true },
            where: eq(userTable.username, candidate),
        });
        if (!existing) return candidate;
    }

    return `${normalizedBase}-${randomUUID().slice(0, 8)}`;
}

function createFlowStateToken() {
    return randomBytes(32).toString("base64url");
}

function createCodeVerifier() {
    return randomBytes(64).toString("base64url");
}

function createCodeChallenge(codeVerifier: string) {
    return createHash("sha256").update(codeVerifier).digest("base64url");
}

export function getGoogleOAuthConfig(event: any): GoogleOAuthConfig {
    const config = useRuntimeConfig(event);
    const clientId = config.googleClientId ?? process.env.NUXT_GOOGLE_CLIENT_ID;
    const clientSecret = config.googleClientSecret
        ?? config.googleSecretId
        ?? process.env.NUXT_GOOGLE_CLIENT_SECRET
        ?? process.env.NUXT_GOOGLE_SECRET_ID;

    if (!clientId || !clientSecret) {
        throw createError({
            statusCode: 500,
            statusMessage: "Google OAuth credentials are not configured",
        });
    }

    return {
        clientId,
        clientSecret,
    };
}

export function getGoogleOAuthCallbackUrl(event: any): string {
    const config = useRuntimeConfig(event);
    const configuredAppUrl = config?.public?.appUrl ?? process.env.NUXT_PUBLIC_APP_URL;

    if (typeof configuredAppUrl === "string" && configuredAppUrl.trim().length > 0) {
        try {
            const origin = new URL(configuredAppUrl).origin;
            return `${origin}/api/v1/auth/google/callback`;
        } catch {
            // Fall back to the incoming request origin when app URL is malformed.
        }
    }

    const requestOrigin = getRequestURL(event).origin;
    return `${requestOrigin}/api/v1/auth/google/callback`;
}

function serializeFlowCookie(value: GoogleOAuthFlowCookie) {
    return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function parseFlowCookie(raw: string): GoogleOAuthFlowCookie | null {
    try {
        const decoded = Buffer.from(raw, "base64url").toString("utf8");
        const parsed = JSON.parse(decoded) as GoogleOAuthFlowCookie;
        if (!parsed?.state || !parsed?.codeVerifier || !parsed?.redirectTo || !parsed?.createdAt) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function startGoogleOAuthFlow(event: any, redirectRaw?: string) {
    const redirectTo = sanitizeInternalRedirect(
        typeof redirectRaw === "string" ? redirectRaw : undefined,
        "/home",
    );
    const state = createFlowStateToken();
    const codeVerifier = createCodeVerifier();
    const codeChallenge = createCodeChallenge(codeVerifier);
    const callbackUrl = getGoogleOAuthCallbackUrl(event);
    const { clientId } = getGoogleOAuthConfig(event);

    const cookiePayload: GoogleOAuthFlowCookie = {
        state,
        codeVerifier,
        redirectTo,
        createdAt: Date.now(),
    };

    setCookie(event, GOOGLE_OAUTH_FLOW_COOKIE, serializeFlowCookie(cookiePayload), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/v1/auth/google",
        maxAge: FLOW_TTL_SECONDS,
    });

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        response_type: "code",
        scope: "openid email profile",
        state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        prompt: "select_account",
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function consumeGoogleOAuthFlowCookie(event: any) {
    const raw = getCookie(event, GOOGLE_OAUTH_FLOW_COOKIE);
    deleteCookie(event, GOOGLE_OAUTH_FLOW_COOKIE, {
        path: "/api/v1/auth/google",
    });
    if (!raw) return null;

    const parsed = parseFlowCookie(raw);
    if (!parsed) return null;

    const expiresAt = parsed.createdAt + FLOW_TTL_SECONDS * 1000;
    if (Date.now() > expiresAt) return null;
    return parsed;
}

export async function exchangeGoogleAuthCode(event: any, args: {
    code: string;
    codeVerifier: string;
}): Promise<{ idToken: string }> {
    const { clientId, clientSecret } = getGoogleOAuthConfig(event);
    const callbackUrl = getGoogleOAuthCallbackUrl(event);

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code: args.code,
            code_verifier: args.codeVerifier,
            redirect_uri: callbackUrl,
            client_id: clientId,
            client_secret: clientSecret,
        }),
    });

    if (!tokenResponse.ok) {
        throw createError({
            statusCode: 502,
            statusMessage: "Google token exchange failed",
        });
    }

    const payload = await tokenResponse.json() as { id_token?: string };
    if (!payload.id_token) {
        throw createError({
            statusCode: 502,
            statusMessage: "Google token exchange did not return an ID token",
        });
    }

    return { idToken: payload.id_token };
}

export async function verifyGoogleIdentity(event: any, idToken: string): Promise<GoogleIdentity> {
    const { clientId } = getGoogleOAuthConfig(event);
    const client = new OAuth2Client(clientId);

    const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid Google identity payload",
        });
    }
    if (!payload.email || payload.email_verified !== true) {
        throw createError({
            statusCode: 403,
            statusMessage: "Google account email is not verified",
        });
    }
    if (!payload.iss || !ALLOWED_ISSUERS.has(payload.iss)) {
        throw createError({
            statusCode: 403,
            statusMessage: "Invalid Google token issuer",
        });
    }

    return {
        email: payload.email,
        name: payload.name || payload.email,
        givenName: payload.given_name || payload.name || payload.email.split("@")[0] || "user",
    };
}

export async function findOrCreateGoogleUser(event: any, identity: GoogleIdentity): Promise<string> {
    const existingUser = await db.query.userTable.findFirst({
        where: eq(userTable.email, identity.email),
    });
    if (existingUser) {
        return existingUser.id;
    }

    const config = useRuntimeConfig(event);
    assertSignupEnabled(config.public.enableSignIn);

    const username = await generateUniqueUsername(identity.givenName);
    const placeholderHash = await hash(randomUUID(), {
        memoryCost: 19456,
        timeCost: 6,
        outputLen: 48,
        parallelism: 1,
    });

    const userId = randomUUID();
    const userToInsert: InsertUser = {
        id: userId,
        email: identity.email,
        name: identity.name,
        username,
        hashedPassword: placeholderHash,
        validationDate: new Date(),
        notifications: true,
        locale: "en",
        credit: 20,
    };

    try {
        await db.insert(userTable).values(userToInsert);
        return userId;
    } catch {
        // Handle races where another request created the same email concurrently.
        const createdUser = await db.query.userTable.findFirst({
            columns: { id: true },
            where: and(
                eq(userTable.email, identity.email),
                ne(userTable.id, userId),
            ),
        });
        if (createdUser?.id) return createdUser.id;
        throw createError({
            statusCode: 500,
            statusMessage: "Could not create local account for Google user",
        });
    }
}

export async function issueAuthSession(event: any, userId: string) {
    await invalidateSessionByUserId(userId);
    const token = generateSessionToken();
    const session = await createSession(token, userId);

    setCookie(event, "auth_session", session.id, {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 21,
    });
}
