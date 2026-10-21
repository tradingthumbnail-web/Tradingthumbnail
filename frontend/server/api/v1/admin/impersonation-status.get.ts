import { db } from "~~/server/database";
import { userTable } from "~~/server/database/schemas/user.schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
    const adminId = getCookie(event, "admin_id");
    const currentUser = event.context.user;
    
    if (!adminId || !currentUser) {
        return {
            isImpersonating: false,
            currentUser: null,
        };
    }

    return {
        isImpersonating: true,
        currentUser: {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
        },
    };
});
