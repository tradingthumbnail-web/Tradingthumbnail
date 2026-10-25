import { startGoogleOAuthFlow } from "~~/server/services/auth/google-oauth";

export default defineEventHandler(async (event) => {
    const query = getQuery(event) as { redirect?: string };
    const redirectUrl = startGoogleOAuthFlow(event, query.redirect);
    return sendRedirect(event, redirectUrl, 302);
});
