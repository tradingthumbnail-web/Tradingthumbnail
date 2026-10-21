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
        const existingPipeline = await db.query.pipelineTable.findFirst({
            where: and(
                eq(pipelineTable.id, id),
                eq(pipelineTable.userId, user.id),
                isNull(pipelineTable.deletedAt),
            ),
        });

        if (!existingPipeline) {
            throw createError({ statusCode: 404, statusMessage: 'Pipeline not found' });
        }

        await db.update(pipelineTable)
            .set({ deletedAt: new Date() })
            .where(eq(pipelineTable.id, id));

        return { success: true };
    } catch (error: any) {
        if (error.statusCode) throw error;
        console.error("-x- Error deleting pipeline", error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});