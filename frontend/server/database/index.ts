import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { validateEnvironmentVariables } from "../utils/env-validation";
import { log } from "../utils/logger";

import * as activitySchema from "./schemas/activity.schema";
import * as avatarSchema from "./schemas/avatar.schema";
import * as assetSchema from "./schemas/assets.schema";
import * as canvasSchema from "./schemas/canvas.schema";
import * as imageSchema from "./schemas/image.schema";
import * as pipelineSchema from "./schemas/pipeline.schema";
import * as projectSchema from "./schemas/project.schema";
import * as productSchema from "./schemas/product.schema";
import * as paymentSchema from "./schemas/payment.schema";
import * as subscriptionSchema from "./schemas/subscription.schema";
import * as taskSchema from "./schemas/task.schema";
import * as tierSchema from "./schemas/tier.schema";
import * as userSchema from "./schemas/user.schema";
import * as styleSchema from "./schemas/style.schema";
import * as sessionSchema from "./schemas/session.schema";
import * as resetTokenSchema from "./schemas/reset-token.schema";

validateEnvironmentVariables();

log.info(`Application running in ${process.env.NODE_ENV} mode`);

const connectionString = process.env.NUXT_DATABASE_CONNECTION_STRING;
if (!connectionString) {
    throw new Error('NUXT_DATABASE_CONNECTION_STRING environment variable is required');
}

const pool = new Pool({
    connectionString,
});

export const db = drizzle({ client: pool, schema: {
    ...activitySchema,
    ...avatarSchema,
    ...assetSchema,
    ...canvasSchema,
    ...imageSchema,
    ...pipelineSchema,
    ...projectSchema,
    ...productSchema,
    ...paymentSchema,
    ...subscriptionSchema,
    ...taskSchema,
    ...tierSchema,
    ...userSchema,
    ...styleSchema,
    ...sessionSchema,
    ...resetTokenSchema,
} });