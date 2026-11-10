import { and, eq, ne } from "drizzle-orm";

import { db } from "~~/server/database";
import { userTable } from "~~/server/database/schemas/user.schema";

type ProfileUpdateBody = {
    name?: string;
    username?: string;
    notifications?: boolean;
};

const NAME_MAX_LENGTH = 80;
const USERNAME_MAX_LENGTH = 60;
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user?.id) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const body = await readBody<ProfileUpdateBody>(event);
    const name = body?.name?.trim();
    const username = body?.username?.trim();
    const notifications = body?.notifications;

    if (!name || !username || typeof notifications !== "boolean") {
        throw createError({ statusCode: 400, statusMessage: "Invalid profile payload" });
    }
    if (name.length > NAME_MAX_LENGTH || username.length > USERNAME_MAX_LENGTH) {
        throw createError({ statusCode: 400, statusMessage: "Profile fields exceed maximum length" });
    }
    if (!USERNAME_PATTERN.test(username)) {
        throw createError({
            statusCode: 400,
            statusMessage: "Username can only include letters, numbers, underscores and hyphens"
        });
    }

    try {
        const duplicatedUser = await db.query.userTable.findFirst({
            columns: { id: true },
            where: and(
                eq(userTable.username, username),
                ne(userTable.id, user.id),
            ),
        });
        if (duplicatedUser) {
            throw createError({ statusCode: 409, statusMessage: "Username already exists" });
        }

        const [updatedUser] = await db.update(userTable).set({
            name,
            username,
            notifications,
            updatedAt: new Date(),
        }).where(eq(userTable.id, user.id)).returning({
            id: userTable.id,
            name: userTable.name,
            username: userTable.username,
            notifications: userTable.notifications,
            email: userTable.email,
        });
        if (!updatedUser) {
            throw createError({ statusCode: 404, statusMessage: "User not found" });
        }

        return updatedUser;
    } catch (error: any) {
        if (error?.statusCode) throw error;
        console.error("Error updating user profile", error);
        throw createError({ statusCode: 500, statusMessage: "Internal server error" });
    }
});
