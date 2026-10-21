import { eq } from "drizzle-orm";
import { hash, verify } from "@node-rs/argon2";

import { db } from "~~/server/database";
import { userTable } from "~~/server/database/schemas/user.schema";

export default defineEventHandler(async (event) => {
    try {
        const user = event.context.user;
        if (!user?.id) {
            throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
        }

        const { currentPassword, newPassword, repeatNewPassword } = await readBody(event);

        if (
            typeof currentPassword !== 'string'
            || typeof newPassword !== 'string'
            || typeof repeatNewPassword !== 'string'
        ) {
            throw createError({ statusCode: 400, statusMessage: 'Invalid password payload' });
        }

        if (!currentPassword || !newPassword || !repeatNewPassword) {
            throw createError({ statusCode: 400, statusMessage: 'All password fields are required' });
        }

        if (newPassword !== repeatNewPassword) {
            throw createError({ statusCode: 400, statusMessage: 'New passwords do not match' });
        }

        if (newPassword.length < 6 || newPassword.length > 255) {
            throw createError({ statusCode: 400, statusMessage: 'New password must be between 6 and 255 characters' });
        }

        if (currentPassword === newPassword) {
            throw createError({ statusCode: 400, statusMessage: 'New password must be different from current password' });
        }

        const existingUser = await db.query.userTable.findFirst({
            where: eq(userTable.id, user.id),
        });

        if (!existingUser) {
            throw createError({ statusCode: 404, statusMessage: 'User not found' });
        }

        if (!existingUser.hashedPassword) {
            throw createError({ statusCode: 400, statusMessage: 'Password authentication not available for this account' });
        }

        const validCurrentPassword = await verify(existingUser.hashedPassword, currentPassword, {
            memoryCost: 19456,
            timeCost: 6,
            outputLen: 48,
            parallelism: 1
        });

        if (!validCurrentPassword) {
            throw createError({ statusCode: 400, statusMessage: 'Current password is incorrect' });
        }

        const passwordHash = await hash(newPassword, {
            memoryCost: 19456,
            timeCost: 6,
            outputLen: 48,
            parallelism: 1
        });

        await db.update(userTable).set({ hashedPassword: passwordHash }).where(eq(userTable.id, existingUser.id));

        return {
            statusCode: 200,
            statusMessage: 'Password updated successfully'
        };
    } catch (error) {
        // If it's an error created with createError, rethrow it, otherwise wrap it
        if (error && typeof error === "object" && 'statusCode' in error) {
            throw error;
        }
        throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
    }
});