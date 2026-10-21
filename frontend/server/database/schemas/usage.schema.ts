import { InferSelectModel, InferInsertModel, relations } from "drizzle-orm";
import { pgTable, timestamp, uuid, text, integer, index, serial, jsonb } from "drizzle-orm/pg-core";

import { userTable } from "./user.schema";

export const usageTable = pgTable("usage", {
	id: serial("id").primaryKey(),

	userId: uuid("user_id")
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

	operationType: text("operation_type").notNull().$type<UsageOperationType>(),
	targetId: uuid("target_id"),
	targetType: text("target_type").notNull().$type<UsageTargetType>(),

	creditsConsumed: integer("credits_consumed").notNull(),
	avatarCreditsConsumed: integer("avatar_credits_consumed").notNull().default(0),

	metadata: jsonb("metadata").notNull().default({}),

	createdAt: timestamp("created_at", {
		withTimezone: true,
		mode: "date"
	}).notNull().defaultNow(),
}, (table) => [
	index("user_id_usage_idx").on(table.userId),
	index("operation_type_usage_idx").on(table.operationType),
	index("target_type_usage_idx").on(table.targetType),
	index("target_id_usage_idx").on(table.targetId),
	index("created_at_usage_idx").on(table.createdAt),
]);

export const usageRelations = relations(usageTable, ({ one }) => ({
	user: one(userTable, {
		fields: [usageTable.userId],
		references: [userTable.id],
	}),
}));

export type Usage = InferSelectModel<typeof usageTable>;
export type InsertUsage = InferInsertModel<typeof usageTable>;

export type UsageOperationType =
	| "IMAGE_GENERATION"
	| "IMAGE_VARIATION"
	| "AVATAR_TRAINING"
	| "TOOL_EXECUTION"
	| "STYLE_CREATION";

export type UsageTargetType =
	| "IMAGE"
	| "AVATAR"
	| "STYLE"
	| "TOOL_EXECUTION"
	| "CANVAS";
