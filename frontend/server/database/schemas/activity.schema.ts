import { InferSelectModel, InferInsertModel, relations } from "drizzle-orm";
import { pgTable, timestamp, uuid, text, index, serial, jsonb } from "drizzle-orm/pg-core";

import { type EventType } from "~~/shared/event-types";
import { projectTable } from "./project.schema";
import { userTable } from "./user.schema";

export const activityTable = pgTable("activity", {
    id: serial("id").primaryKey(),

    projectId: uuid("project_id")
        .references(() => projectTable.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    userId: uuid("user_id")
        .references(() => userTable.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    
    targetType: text("target_type").notNull().$type<TargetType>().default("IMAGE"),
    targetId: uuid("target_id").notNull(),
    eventType: text("event_type").notNull().$type<EventType>().default("image.generated"),

    payload: jsonb("payload").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (table) => [
    index("project_id_activity_idx").on(table.projectId),
    index("user_id_activity_idx").on(table.userId),
    index("target_type_activity_idx").on(table.targetType),
    index("target_id_activity_idx").on(table.targetId),
    index("event_type_activity_idx").on(table.eventType),
]);

export const activityRelations = relations(activityTable, ({ one }) => ({
    project: one(projectTable, {
        fields: [activityTable.projectId],
        references: [projectTable.id],
    }),
    user: one(userTable, {
        fields: [activityTable.userId],
        references: [userTable.id],
    }),
}));

export type Activity = InferSelectModel<typeof activityTable>;
export type InsertActivity = InferInsertModel<typeof activityTable>;

export type TargetType = "IMAGE" | "PROJECT" | "BRANCH" | "STYLE";