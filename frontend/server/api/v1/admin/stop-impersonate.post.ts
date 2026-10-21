import { invalidateSession } from "~~/server/utils/auth";

export default defineEventHandler(async (event) => {
    const session = event.context.session;
    
    if (!session) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const adminId = getCookie(event, "admin_id");
    
    if (!adminId) {
        throw createError({ statusCode: 400, statusMessage: 'Not impersonating' });
    }

    try {
        await invalidateSession(session.id);
        
        deleteCookie(event, "auth_session");
        deleteCookie(event, "admin_id");
        
        console.log(`[IMPERSONATION] Ended impersonation, returning to admin ${adminId}`);
        
        event.node.res.statusCode = 200;
        return {
            statusCode: 200,
            statusMessage: "Impersonation ended"
        };
    } catch (error) {
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});
