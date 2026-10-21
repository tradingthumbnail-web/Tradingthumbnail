import { invalidateSession, invalidateSessionByUserId } from "~~/server/utils/auth";

export default defineEventHandler(async (event) => {
    if (!event.context.session) {
        throw createError({
            statusCode: 403,
            statusMessage: "Forbidden. There is no session to log out of.",
        });
    };

    console.log("--- Logging out")
    await invalidateSession(event.context.session.id);
    await invalidateSessionByUserId(event.context.session.userId);
    deleteCookie(event, "auth_session");
    console.log(" |- Logged out")
    event.node.res.statusCode = 200;
});