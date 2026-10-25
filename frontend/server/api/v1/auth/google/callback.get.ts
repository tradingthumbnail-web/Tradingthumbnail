import {
    consumeGoogleOAuthFlowCookie,
    exchangeGoogleAuthCode,
    findOrCreateGoogleUser,
    issueAuthSession,
    verifyGoogleIdentity,
} from "~~/server/services/auth/google-oauth";
import { sanitizeInternalRedirect } from "~~/shared/clicklab/safe-redirect";

function redirectToLoginWithOauthError(event: any) {
    return sendRedirect(event, "/login?oauthError=google_signin_failed", 302);
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event) as {
        code?: string;
        state?: string;
        error?: string;
        error_description?: string;
    };

    if (query.error) return redirectToLoginWithOauthError(event);

    if (!query.code || !query.state) return redirectToLoginWithOauthError(event);

    const flow = consumeGoogleOAuthFlowCookie(event);
    if (!flow || flow.state !== query.state) return redirectToLoginWithOauthError(event);

    try {
        const { idToken } = await exchangeGoogleAuthCode(event, {
            code: query.code,
            codeVerifier: flow.codeVerifier,
        });

        const identity = await verifyGoogleIdentity(event, idToken);
        const userId = await findOrCreateGoogleUser(event, identity);
        await issueAuthSession(event, userId);

        const redirectTo = sanitizeInternalRedirect(flow.redirectTo, "/home");
        return sendRedirect(event, redirectTo, 302);
    } catch (error) {
        console.error("Google OAuth callback failed", {
            statusCode: typeof error === "object" && error && "statusCode" in error ? (error as any).statusCode : undefined,
        });
        return redirectToLoginWithOauthError(event);
    }
});
