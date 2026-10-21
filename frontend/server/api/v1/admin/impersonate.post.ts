import { db } from "~~/server/database";
import { userTable } from "~~/server/database/schemas/user.schema";
import { eq } from "drizzle-orm";
import { createSession, generateSessionToken, invalidateSessionByUserId } from "~~/server/utils/auth";

export default defineEventHandler(async (event) => {
    const admin = event.context.user;
    
    if (!admin || admin.role !== 'ADMIN') {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
    }

    const { userId } = await readBody(event);
    
    if (!userId) {
        throw createError({ statusCode: 400, statusMessage: 'User ID is required' });
    }

    try {
        const targetUser = await db.query.userTable.findFirst({
            where: eq(userTable.id, userId),
        });

        if (!targetUser) {
            throw createError({ statusCode: 404, statusMessage: 'User not found' });
        }

        await invalidateSessionByUserId(targetUser.id).catch(() => {});

        const sessionToken = generateSessionToken();
        const session = await createSession(sessionToken, targetUser.id);

        setCookie(event, "auth_session", session.id, {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 21
        });

        setCookie(event, "admin_id", admin.id!, {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 21
        });

        console.log(`[IMPERSONATION] Admin ${admin.id} (${admin.email}) impersonated user ${targetUser.id} (${targetUser.email})`);

        event.node.res.statusCode = 200;
        return {
            statusCode: 200,
            statusMessage: "Impersonation successful",
            user: {
                id: targetUser.id,
                name: targetUser.name,
                email: targetUser.email,
            }
        };
    } catch (error) {
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});
