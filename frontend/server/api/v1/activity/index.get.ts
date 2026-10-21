import { desc, eq } from "drizzle-orm";

import { db } from "~~/server/database";
import { activityTable } from "~~/server/database/schemas/activity.schema";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    };

    // If there is limit, apply it
    const { limit }: { limit?: string } = getQuery(event);
    let limitNumber = 50;
    if (limit) {
        limitNumber = parseInt(limit as string);
    }

    try {
        const activity = await db.query.activityTable.findMany({
            where: eq(activityTable.userId, user.id),
            orderBy: desc(activityTable.createdAt),
            limit: limitNumber ? limitNumber : undefined,
        });

        return activity;
    } catch (error) {
        console.error("-x- Error getting activity", error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});