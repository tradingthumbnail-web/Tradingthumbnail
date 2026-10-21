import { InferSelectModel, InferInsertModel, relations } from "drizzle-orm";
import { pgTable, text, timestamp, jsonb, uuid, boolean, index, serial } from "drizzle-orm/pg-core";

import { userTable } from "./user.schema";

export const assetTable = pgTable("asset", {
	id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    name: text("name").notNull(),
    type: text("type").notNull().$type<AssetType>(),
    
    storageKey: text("storage_key").notNull().unique(),
    
    isPublic: boolean("is_public").notNull().default(false),
    
    createdAt: timestamp("created_at", {
        withTimezone: true,
		mode: "date"
	}).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
    
    metadata: jsonb("metadata").notNull().default({}),
}, (table) => [
    index("user_id_asset_idx").on(table.userId),
    index("is_public_asset_idx").on(table.isPublic),
    index("deleted_at_asset_idx").on(table.deletedAt),
]);

export const assetRelation = relations(assetTable, ({ one }) => ({
    user: one(userTable, {
        fields: [assetTable.userId],
        references: [userTable.id]
    })
}));

export const assetUserFavouriteTable = pgTable("asset_user_favourite", {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => userTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    assetId: uuid("asset_id")
        .notNull()
        .references(() => assetTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
}, (table) => [
    index("user_id_asset_user_favourite_idx").on(table.userId),
    index("asset_id_asset_user_favourite_idx").on(table.assetId),
]);

export const assetUserFavouriteRelation = relations(assetUserFavouriteTable, ({ one }) => ({
    user: one(userTable, {
        fields: [assetUserFavouriteTable.userId],
        references: [userTable.id]
    }),
    asset: one(assetTable, {
        fields: [assetUserFavouriteTable.assetId],
        references: [assetTable.id]
    })
}));

export type Asset = InferSelectModel<typeof assetTable>;
export type InsertAsset = InferInsertModel<typeof assetTable>;
export type AssetType = "OBJECT" | "AVATAR";