import { InferSelectModel, InferInsertModel, relations } from "drizzle-orm";
import { pgTable, timestamp, uuid, text, jsonb, index } from "drizzle-orm/pg-core";

import { userTable } from "./user.schema";

export const canvasTable = pgTable("canvas", {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),

    name: text('name').notNull(),
    description: text('description'),

    data: jsonb('data').notNull().$type<any>(),
    
    metadata: jsonb('metadata').$type<CanvasMetadata>(),
    
    userId: uuid('user_id')
        .references(() => userTable.id, { onDelete: 'cascade', onUpdate: 'cascade' })
        .notNull(),
	
    createdAt: timestamp("created_at", {
		withTimezone: true,
		mode: "date"
	}).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", {
        withTimezone: true,
        mode: "date"
    }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
}, (table) => [
    index("user_id_canvas_idx").on(table.userId),
    index("slug_canvas_idx").on(table.slug),
    index("deleted_at_canvas_idx").on(table.deletedAt),
]);

export const canvasRelations = relations(canvasTable, ({ one }) => ({
    user: one(userTable, {
        fields: [canvasTable.userId],
        references: [userTable.id]
    })
}));

export type Canvas = InferSelectModel<typeof canvasTable>;
export type InsertCanvas = InferInsertModel<typeof canvasTable>;
export interface CanvasMetadata {
    tags?: string[];
    rating?: number;
    isFavorite?: boolean;
    _metadataVersion?: number;
}