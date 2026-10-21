import { InferSelectModel, InferInsertModel, relations, sql } from "drizzle-orm";
import { pgTable, text, uuid, integer, timestamp, jsonb, boolean, index } from "drizzle-orm/pg-core";

import { userTable } from "./user.schema";

export const stylesTable = pgTable("style", {
    id: uuid("id")
        .primaryKey()
        .defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),

    style: jsonb("style").notNull().$type<JSONStyle>(),

    createdBy: uuid("created_by")
        .references(() => userTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    isPublic: boolean("is_public").notNull().default(false),

    version: integer("version").notNull().default(1),
    tags: text("tags").array().notNull().default([]),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
}, (table) => [
    index("created_by_style_idx").on(table.createdBy),
    index("is_public_style_idx").on(table.isPublic),
]);

export const styleRelation = relations(stylesTable, ({ one }) => ({
    createdBy: one(userTable, {
        fields: [stylesTable.createdBy],
        references: [userTable.id]
    })
}));

export type Style = InferSelectModel<typeof stylesTable>;
export type InsertStyle = InferInsertModel<typeof stylesTable>;
export type JSONStyle = {
    "style_aesthetic": Record<string, any>,
    "materials_and_textures": Record<string, any>,
    "lighting_and_shadows": Record<string, any>,
    "composition": Record<string, any>,
    "typography": Record<string, any>,
    "design_extras": Record<string, any>,
    "mood_keywords": string[],
    "key_attributes": string[]
}