import { eq } from "drizzle-orm";

import { db } from "~~/server/database";
import { userTable } from "~~/server/database/schemas/user.schema";
import { addAvatarCreditsToUser } from "~~/server/services/user/add-avatar-credits-to-user";

export default defineEventHandler(async (event) => {
    const admin = event.context.user;
    
    if (!admin || admin.role !== 'ADMIN') {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
    }

    const userId = getRouterParam(event, 'userId');
    if (!userId) {
        throw createError({ statusCode: 400, statusMessage: 'User ID is required' });
    }

    const { amount } = await readBody(event);
    if (!amount || typeof amount !== 'number' || amount <= 0 || !Number.isInteger(amount)) {
        throw createError({ statusCode: 400, statusMessage: 'Valid amount is required' });
    }

    try {
        const user = await db.query.userTable.findFirst({
            where: eq(userTable.id, userId),
        });

        if (!user) {
            throw createError({ statusCode: 404, statusMessage: 'User not found' });
        }

        const updatedUser = await addAvatarCreditsToUser({
            userId: userId,
            amount: amount
        });

        return {
            success: true,
            message: `Successfully granted ${amount} avatar credit(s) to user`,
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                avatarCredit: updatedUser.avatarCredit
            }
        };
    } catch (error) {
        console.error(error);
        if (error && typeof error === 'object' && 'statusCode' in error) {
            throw error;
        }
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});