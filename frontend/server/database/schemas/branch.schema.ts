import { InferSelectModel, InferInsertModel, relations, sql } from "drizzle-orm";
import { pgTable, timestamp, uuid, text, boolean, integer, AnyPgColumn, index, jsonb } from "drizzle-orm/pg-core";
import { projectTable } from "./project.schema";
import { imageTable } from "./image.schema";

export const branchTable = pgTable("branch", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    
    projectId: uuid("project_id")
        .references(() => projectTable.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    rootId: uuid("root_id")
        .references(() => imageTable.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    headImageId: uuid("head_image_id")
        .references(() => imageTable.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    
    default: boolean("default").notNull().default(false),
    isLocked: boolean("is_locked").notNull().default(false),
    metadata: jsonb("metadata").notNull().default({}),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
}, (table) => [
    index("project_id_branch_idx").on(table.projectId),
    index("root_id_branch_idx").on(table.rootId),
    index("head_image_id_branch_idx").on(table.headImageId),
    index("default_branch_idx").on(table.default),
    index("is_locked_branch_idx").on(table.isLocked),
]);

export const branchRelations = relations(branchTable, ({ one, many }) => ({
    project: one(projectTable, {
        fields: [branchTable.projectId],
        references: [projectTable.id],
    }),
    root: one(imageTable, {
        fields: [branchTable.rootId],
        references: [imageTable.id],
    }),
    headImage: one(imageTable, {
        fields: [branchTable.headImageId],
        references: [imageTable.id],
    }),
    images: many(imageTable),
}));

export type Branch = InferSelectModel<typeof branchTable>;
export type InsertBranch = InferInsertModel<typeof branchTable>;