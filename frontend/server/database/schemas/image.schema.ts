import { InferSelectModel, InferInsertModel, relations, sql } from "drizzle-orm";
import { pgTable, timestamp, uuid, text, boolean, integer, AnyPgColumn, index, jsonb } from "drizzle-orm/pg-core";

import { userTable } from "./user.schema";
import { projectTable } from "./project.schema";
import { branchTable } from "./branch.schema";
import { toolTable } from "./tool.schema";

import { type ImageType } from "~~/shared/enums/image-types";

export const imageTable = pgTable("image", {
    id: uuid("id").primaryKey().defaultRandom(),

    state: text("state").notNull().$type<ImageState>(),
    isPublic: boolean("is_public").notNull().default(false),
    userId: uuid("user_id")
        .notNull()
        .references(() => userTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    storageKey: text("storage_key").notNull(),
    type: text("type").notNull().$type<ImageType>().default('GENERATION'),
    
    imageMetadata: jsonb("metadata").notNull().default({
        isFavorite: false,
    }).$type<ImageMetadata>(),
    generationMetadata: jsonb("generation_metadata").$type<GenerationMetadata>(),

    toolId: uuid("tool_id")
        .references(() => toolTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    projectId: uuid("project_id")
        .references(() => projectTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    branchId: uuid("branch_id")
        .references((): AnyPgColumn => branchTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    rootId: uuid("root_id")
        .references((): AnyPgColumn => imageTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    parentId: uuid("parent_id")
        .references((): AnyPgColumn => imageTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    depth: integer("depth").notNull().default(0),
    ordinal: integer("ordinal").notNull().default(0),
    
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
}, (table) => [
    index("user_id_image_idx").on(table.userId),
    index("project_id_image_idx").on(table.projectId),
    index("branch_id_image_idx").on(table.branchId),
    index("root_id_image_idx").on(table.rootId),
    index("parent_id_image_idx").on(table.parentId),
    index("tool_id_image_idx").on(table.toolId),
]);

export const imageRelations = relations(imageTable, ({ one, many }) => ({
    user: one(userTable, {
        fields: [imageTable.userId],
        references: [userTable.id],
    }),
    project: one(projectTable, {
        fields: [imageTable.projectId],
        references: [projectTable.id],
    }),
    branch: one(branchTable, {
        fields: [imageTable.branchId],
        references: [branchTable.id],
    }),
    root: one(imageTable, {
        fields: [imageTable.rootId],
        references: [imageTable.id],
    }),
    parent: one(imageTable, {
        fields: [imageTable.parentId],
        references: [imageTable.id],
    }),
    tool: one(toolTable, {
        fields: [imageTable.toolId],
        references: [toolTable.id],
    }),
    children: many(imageTable),
}));

export type Image = InferSelectModel<typeof imageTable>;
export type InsertImage = InferInsertModel<typeof imageTable>;
export type ImageState = 'DRAFT' | 'GENERATED' | 'FAILED';
export type GenerationMetadata = {
    prompt?: string;
    model?: string;
    steps?: number;
    guidanceScale?: number;
    strength?: number;
    seed?: number;
    size?: string;
    aspectRatio?: string;
};
export type ImageMetadata = {
    isFavorite?: boolean;
    [key: string]: any;
};