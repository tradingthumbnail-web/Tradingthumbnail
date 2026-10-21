import { db } from "~~/server/database";
import { pipelineTable } from "~~/server/database/schemas/pipeline.schema";
import { eq, and, isNull, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    try {
        const pipelines = await db.query.pipelineTable.findMany({
            where: and(
                eq(pipelineTable.userId, user.id),
                isNull(pipelineTable.deletedAt),
            ),
            orderBy: [desc(pipelineTable.updatedAt)],
        });

        return pipelines;
    } catch (error) {
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});