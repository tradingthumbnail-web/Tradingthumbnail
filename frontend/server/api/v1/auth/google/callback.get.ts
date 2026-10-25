import {
    consumeGoogleOAuthFlowCookie,
    exchangeGoogleAuthCode,
    findOrCreateGoogleUser,
    issueAuthSession,
    verifyGoogleIdentity,
} from "~~/server/services/auth/google-oauth";
import { sanitizeInternalRedirect } from "~~/shared/clicklab/safe-redirect";

export default defineEventHandler(async (event) => {
    const query = getQuery(event) as {
        code?: string;
        state?: string;
        error?: string;
        error_description?: string;
    };

    if (query.error) {
        throw createError({
            statusCode: 400,
            statusMessage: `Google authorization failed: ${query.error_description || query.error}`,
        });
    }

    if (!query.code || !query.state) {
        throw createError({
            statusCode: 400,
            statusMessage: "Google callback is missing required parameters",
        });
    }

    const flow = consumeGoogleOAuthFlowCookie(event);
    if (!flow) {
        throw createError({
            statusCode: 400,
            statusMessage: "Google OAuth state has expired or is invalid",
        });
    }
    if (flow.state !== query.state) {
        throw createError({
            statusCode: 400,
            statusMessage: "Google OAuth state mismatch",
        });
    }

    const { idToken } = await exchangeGoogleAuthCode(event, {
        code: query.code,
        codeVerifier: flow.codeVerifier,
    });

    const identity = await verifyGoogleIdentity(event, idToken);
    const userId = await findOrCreateGoogleUser(event, identity);
    await issueAuthSession(event, userId);

    const redirectTo = sanitizeInternalRedirect(flow.redirectTo, "/home");
    return sendRedirect(event, redirectTo, 302);
});
