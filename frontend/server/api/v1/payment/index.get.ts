import { eq } from "drizzle-orm";

import { db } from "~~/server/database";
import { paymentTable } from "~~/server/database/schemas/payment.schema";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    try {
        const payments = await db.query.paymentTable.findMany({
            where: eq(paymentTable.userId, user.id),
        });

        return payments;
    } catch (error: any) {
        console.error(error);
        if (error.statusCode) {
            throw error;
        }
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});