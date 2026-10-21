import { InferSelectModel, InferInsertModel, relations } from "drizzle-orm";
import { pgTable, timestamp, uuid, text, jsonb, index, integer } from "drizzle-orm/pg-core";

import { userTable } from "./user.schema";

export const pipelineTable = pgTable("pipeline", {
    id: uuid('id').primaryKey().defaultRandom(),
    
    userId: uuid('user_id')
        .references(() => userTable.id, { onDelete: 'cascade', onUpdate: 'cascade' })
        .notNull(),

    name: text('name').notNull(),
    description: text('description'),

    canvasData: jsonb('canvas_data').notNull().$type<PipelineCanvasData>(),
    config: jsonb('config').notNull().default({}).$type<PipelineConfig>(),

    executionCount: integer('execution_count').notNull().default(0),

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
    index("user_id_pipeline_idx").on(table.userId),
    index("deleted_at_pipeline_idx").on(table.deletedAt),
]);

export const pipelineRelations = relations(pipelineTable, ({ one }) => ({
    user: one(userTable, {
        fields: [pipelineTable.userId],
        references: [userTable.id]
    })
}));

export type Pipeline = InferSelectModel<typeof pipelineTable>;
export type InsertPipeline = InferInsertModel<typeof pipelineTable>;

export type PipelineElementType = 'ASSET' | 'AVATAR' | 'TEXT';

export interface PipelineCanvasData {
    fabricJson: object;
    elements: PipelineElement[];
}

export interface PipelineElement {
    id: string;
    fabricObjectId: string;
    type: PipelineElementType;
    label: string;
    position: { x: number; y: number; width: number; height: number };
    isConfigurable: boolean;
    additionalInstructions?: string;
    assetOptions?: {
        assetIds: string[];
        defaultAssetId?: string;
    };
    avatarOptions?: {
        avatarIds: string[];
        defaultAvatarId?: string;
        characterType: 'avatar' | 'uploadable';
    };
    textOptions?: {
        fixedText?: string;
        placeholder?: string;
        defaultText?: string;
    };
}

export interface PipelineConfig {
    thumbnailStyle?: string;
    backgroundColor?: string;
    generationModel?: string;
    referenceImageStorageKey?: string;
}

export interface PipelineRunParameters {
    [elementId: string]: {
        assetId?: string;
        avatarId?: string;
        text?: string;
        characterImageBase64?: string;
    };
}