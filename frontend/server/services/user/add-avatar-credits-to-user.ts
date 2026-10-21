import { eq } from "drizzle-orm";

import { db } from "~~/server/database";
import { userTable } from "~~/server/database/schemas/user.schema";

export async function addAvatarCreditsToUser({ userId, amount}: { userId: string, amount: number }) {
    try {
        const user = await db.query.userTable.findFirst({
            where: eq(userTable.id, userId)
        });
        if (!user) {
            throw createError({
                statusCode: 400,
                statusMessage: "User not found"
            });
        }
        const updatedUser = await db.update(userTable).set({
            avatarCredit: user.avatarCredit + amount
        }).where(eq(userTable.id, userId)).returning();
        
        return updatedUser[0];
    } catch (error) {
        console.error("-x- Error adding avatar credits to user", error);
        throw error;
    }
}