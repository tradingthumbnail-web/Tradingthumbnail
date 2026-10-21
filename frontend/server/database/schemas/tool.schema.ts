import { InferSelectModel, InferInsertModel, relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, boolean, jsonb, index } from "drizzle-orm/pg-core";

import { userTable } from "./user.schema";
import type { ToolType, ToolStatus, ToolCategory } from "~~/shared/enums/tool";

export const toolTable = pgTable("tool", {
	id: uuid("id").primaryKey().defaultRandom(),

    name: jsonb("name").notNull().$type<ToolInformation>(),
    description: jsonb("description").$type<ToolInformation>(),
    
    weightsUrl: text("weights_url"),
    
    type: text("type").notNull().default("IMAGE").$type<ToolType>(),
    isPublic: boolean("is_public").notNull().default(true),
    status: text("status").notNull().default("DRAFT").$type<ToolStatus>(),
    category: text("category").notNull().$type<ToolCategory>(),

    userId: uuid("user_id")
        .notNull()
        .references(() => userTable.id, { onDelete: "cascade", onUpdate: "cascade" }),

    createdAt: timestamp("created_at", {
		withTimezone: true,
		mode: "date"
	}).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", {
        withTimezone: true,
		mode: "date"
	}).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", {
        withTimezone: true,
        mode: "date"
    }),

    metadata: jsonb("metadata").$type<ToolMetadata>().notNull().default({
        requiresPrompt: false,
        systemPrompt: '',
        modelConfiguration: {},
    }),
}, (table) => [
    index("public_tool_idx").on(table.isPublic),
    index("status_tool_idx").on(table.status),
    index("category_tool_idx").on(table.category),
    index("deleted_at_tool_idx").on(table.deletedAt),
]);

export const toolRelations = relations(toolTable, ({ one }) => ({
	user: one(userTable, {
		fields: [toolTable.userId],
		references: [userTable.id]
	})
}));

export type Tool = InferSelectModel<typeof toolTable>;
export type InsertTool = InferInsertModel<typeof toolTable>;

export type ToolMetadata = {
    requiresPrompt: boolean;
    systemPrompt: string;
    modelConfiguration: {
        [parameter: string]: string | number | boolean;
    }
    [key: string]: any;
};

export type ToolInformation = {
    [locale: string]: string;
};