import { InferSelectModel, InferInsertModel, relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { userTable } from "./user.schema";

export const resetTokensTable = pgTable("reset_token", {
    tokenHash: text("token_hash").primaryKey().unique().notNull(),
    userId: uuid("user_id")
        .notNull()
        .references(() => userTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    expiresAt: timestamp("expires_at", {
        withTimezone: true,
        mode: "date"
    }).notNull()
});

export const resetTokenRelations = relations(resetTokensTable, ({ one }) => ({
    user: one(userTable, {
        fields: [resetTokensTable.userId],
        references: [userTable.id],
    })
}));

export type ResetToken = InferSelectModel<typeof resetTokensTable>;
export type InsertResetToken = InferInsertModel<typeof resetTokensTable>;