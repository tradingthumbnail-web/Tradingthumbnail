import { InferSelectModel, InferInsertModel, relations } from "drizzle-orm";
import { pgTable, timestamp, uuid, text, boolean, jsonb, index } from "drizzle-orm/pg-core";

import { userTable } from "./user.schema";
import { imageTable } from "./image.schema";

export const projectTable = pgTable("project", {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    
    name: text("name").notNull(),
    description: text("description"),
    userId: uuid("user_id")
        .notNull()
        .references(() => userTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    isPublic: boolean("is_public").notNull().default(false),
    settings: jsonb("settings").notNull().default({}),
    status: text("status").notNull().default("ACTIVE").$type<ProjectStatus>(),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
}, (table) => [
    index("user_id_project_idx").on(table.userId),
    index("status_project_idx").on(table.status),
    index("slug_project_idx").on(table.slug),
]);

export const projectRelations = relations(projectTable, ({ one, many }) => ({
    user: one(userTable, {
        fields: [projectTable.userId],
        references: [userTable.id],
    }),
    images: many(imageTable),
}));

export type Project = InferSelectModel<typeof projectTable>;
export type InsertProject = InferInsertModel<typeof projectTable>;
export type ProjectStatus = "ACTIVE" | "ARCHIVED";