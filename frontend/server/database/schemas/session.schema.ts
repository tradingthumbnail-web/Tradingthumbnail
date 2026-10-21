import { InferSelectModel, InferInsertModel, relations, sql } from "drizzle-orm";
import { pgTable, timestamp, uuid, text } from "drizzle-orm/pg-core";

import { userTable } from "./user.schema";

export const sessionTable = pgTable("session", {
	id: text("id").primaryKey(),
	userId: uuid("user_id")
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	expiresAt: timestamp("expires_at", {
		withTimezone: true,
		mode: "date"
	}).notNull()
});

export const sessionRelations = relations(sessionTable, ({ one }) => ({
	user: one(userTable, {
		fields: [sessionTable.userId],
		references: [userTable.id]
	})
}));

export type Session = InferSelectModel<typeof sessionTable>;
export type InsertSession = InferInsertModel<typeof sessionTable>;