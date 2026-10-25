import {
    findOrCreateGoogleUser,
    issueAuthSession,
    verifyGoogleIdentity,
} from "~~/server/services/auth/google-oauth";

export default defineEventHandler(async (event) => {
    const { token }: { token: string } = await readBody(event);
    if (!token) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Token is required',
        });
    };

    try {
        const identity = await verifyGoogleIdentity(event, token);
        const userId = await findOrCreateGoogleUser(event, identity);
        await issueAuthSession(event, userId);
        event.node.res.statusCode = 200;
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