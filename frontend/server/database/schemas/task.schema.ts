import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { pgTable, timestamp, uuid, text, integer, jsonb, index } from "drizzle-orm/pg-core";

import { type TaskType } from "~~/shared/generation/types";

export const taskTable = pgTable("task", {
    id: uuid("id").primaryKey().defaultRandom(),
    
	name: text("name").notNull().$type<TaskType>(),
    description: text("description"),
    
	price: integer("price").notNull(),
	version: integer("version").notNull().default(1),
    
	createdAt: timestamp("created_at", {
		withTimezone: true,
		mode: "date"
	}).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", {
		withTimezone: true,
		mode: "date"
	}).notNull().defaultNow(),
    
	metadata: jsonb("metadata").notNull().default('{}'),
}, (table) => [
    index("name_task_idx").on(table.name),
]);

export type Task = InferSelectModel<typeof taskTable>;
export type InsertTask = InferInsertModel<typeof taskTable>;