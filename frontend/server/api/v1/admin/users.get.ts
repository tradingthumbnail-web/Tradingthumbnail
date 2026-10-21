import { db } from "~~/server/database";
import { userTable } from "~~/server/database/schemas/user.schema";
import { desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    
    if (!user || user.role !== 'ADMIN') {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
    }

    try {
        const users = await db.query.userTable.findMany({
            orderBy: desc(userTable.createdAt),
        });

        return users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            username: u.username,
            role: u.role,
            credit: u.credit,
            createdAt: u.createdAt,
            lastSignedInAt: u.lastSignedInAt,
        }));
    } catch (error) {
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});
