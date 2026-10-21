import { eq, and, isNull } from "drizzle-orm";

import { db } from "~~/server/database";
import { pipelineTable, type PipelineCanvasData, type PipelineConfig } from "~~/server/database/schemas/pipeline.schema";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const id = getRouterParam(event, 'id');
    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Pipeline ID is required' });
    }

    const { name, description, canvasData, config } = await readBody<{
        name?: string;
        description?: string;
        canvasData?: PipelineCanvasData;
        config?: PipelineConfig;
    }>(event);

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

        const [updatedPipeline] = await db.update(pipelineTable)
            .set({
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(canvasData && { canvasData }),
                ...(config && { config }),
                updatedAt: new Date(),
            })
            .where(eq(pipelineTable.id, id))
            .returning();

        return updatedPipeline;
    } catch (error: any) {
        if (error.statusCode) throw error;
        console.error("-x- Error updating pipeline", error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});