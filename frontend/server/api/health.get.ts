import { sql } from 'drizzle-orm';

import { db } from '~~/server/database';

export default defineEventHandler(async (event) => {
    const checks: Record<string, boolean> = {};
    let isHealthy = true;

    try {
        await db.execute(sql`SELECT 1`);
        checks.database = true;
    } catch {
        checks.database = false;
        isHealthy = false;
    }

    setResponseStatus(event, isHealthy ? 200 : 503);
    return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        checks,
        timestamp: new Date().toISOString(),
    };
});
