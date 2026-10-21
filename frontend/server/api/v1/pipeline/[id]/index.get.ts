import { db } from "~~/server/database";
import { pipelineTable } from "~~/server/database/schemas/pipeline.schema";
import { eq, and, isNull } from "drizzle-orm";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const id = getRouterParam(event, 'id');
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Pipeline ID is required' });
    }

    try {
        const pipeline = await db.query.pipelineTable.findFirst({
            where: and(
                eq(pipelineTable.id, id),
                eq(pipelineTable.userId, user.id),
                isNull(pipelineTable.deletedAt),
            ),
        });

        if (!pipeline) {
            throw createError({ statusCode: 404, statusMessage: 'Pipeline not found' });
        }

        return pipeline;
    } catch (error: any) {
        if (error.statusCode) throw error;
        console.error(error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});