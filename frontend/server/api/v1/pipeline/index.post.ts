import { db } from "~~/server/database";
import { pipelineTable, type PipelineCanvasData, type PipelineConfig } from "~~/server/database/schemas/pipeline.schema";

export default defineEventHandler(async (event) => {
    const user = event.context.user;
    if (!user || !user.id) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const { name, description, canvasData, config } = await readBody<{
        name: string;
        description?: string;
        canvasData: PipelineCanvasData;
        config?: PipelineConfig;
    }>(event);

    if (!name || !canvasData) {
        throw createError({ statusCode: 400, statusMessage: 'Name and canvasData are required' });
    }

    try {
        const [pipeline] = await db.insert(pipelineTable).values({
            userId: user.id,
            name,
            description,
            canvasData,
            config: config ?? {},
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();

        return pipeline;
    } catch (error) {
        console.error("-x- Error creating pipeline", error);
        throw createError({ statusCode: 500, statusMessage: 'Internal server error' });
    }
});