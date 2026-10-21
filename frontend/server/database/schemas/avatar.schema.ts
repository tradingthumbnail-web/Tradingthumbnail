import { InferSelectModel, InferInsertModel, relations, sql } from "drizzle-orm";
import { pgTable, timestamp, uuid, text, index, jsonb, integer } from "drizzle-orm/pg-core";

import { userTable } from "./user.schema";

export const avatarTable = pgTable("avatar", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	ownerId: uuid("owner_id")
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    name: text("name").notNull(),

    storageKey: text("storage_key").notNull().unique(),
	trainingMetadata: jsonb("training_metadata").$type<TrainingMetadata>(),

    status: text("status").notNull().default('TRAINING').$type<AvatarStatus>(),
	gender: text("gender").notNull().default('OTHER').$type<AvatarGenders>(),

	createdAt: timestamp("created_at", {
		withTimezone: true,
		mode: "date"
	}).notNull().defaultNow(),
	trainedAt: timestamp("trained_at", {
		withTimezone: true,
		mode: "date"
	}),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
}, (table) => [
    index("user_id_avatar_idx").on(table.userId),
    index("owner_id_avatar_idx").on(table.ownerId),
    index("status_avatar_idx").on(table.status),
    index("gender_avatar_idx").on(table.gender),
]);

export const avatarRelation = relations(avatarTable, ({ one }) => ({
	user: one(userTable, {
		fields: [avatarTable.userId],
		references: [userTable.id],
		relationName: "userAvatar"
	}),
	owner: one(userTable, {
		fields: [avatarTable.ownerId],
		references: [userTable.id],
		relationName: "ownerAvatar"
	})
}));

export type Avatar = InferSelectModel<typeof avatarTable>;
export type InsertAvatar = InferInsertModel<typeof avatarTable>;

export type AvatarGenders = 'MALE' | 'FEMALE' | 'OTHER';
export type AvatarStatus = 'TRAINED' | 'TRAINING' | 'FAILED';
export type TrainingMetadata = {
	trainingImages?: number;
	trainingSteps?: number;
	trainingEpochs?: number;
	baseModel?: string;
	loraRank?: number;
	[key: string]: any;
};