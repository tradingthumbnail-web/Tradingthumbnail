import { InferSelectModel, InferInsertModel, sql, relations } from "drizzle-orm";
import { pgTable, text, integer, timestamp, uuid, boolean, jsonb, index } from "drizzle-orm/pg-core";

import { avatarTable } from "./avatar.schema";
import { stylesTable } from "./style.schema";
import { subscriptionTable } from "./subscription.schema";

export const userTable = pgTable("user", {
	id: uuid("id").primaryKey(),
	name: text("name").notNull(),
	username: text("username").unique().notNull(),
	email: text("email").unique().notNull(),
	hashedPassword: text("hashed_password").notNull(),
	
	credit: integer("credit").notNull().default(0),
	avatarCredit: integer("avatar_credit").notNull().default(0),
	
	stripeCustomerId: text("stripe_customer_id").unique(),
	polarCustomerId: text("polar_customer_id").unique(),

	role: text("role").notNull().default("USER"),
    validationDate: timestamp("validation_date", {
        withTimezone: true,
        mode: "date"
    }),
	notifications: boolean("notifications").notNull().default(true),
	locale: text("locale").default("en").$type<Locale>(),
	
	createdAt: timestamp("created_at", {
		withTimezone: true,
		mode: "date"
	}).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", {
		withTimezone: true,
		mode: "date"
	}).notNull().defaultNow(),
	lastSignedInAt: timestamp("last_signed_in_at", {
		withTimezone: true,
		mode: "date"
	}),
}, (table) => [
    index("role_user_idx").on(table.role),
]);

export const userRelations = relations(userTable, ({ one, many }) => ({
	avatars: many(avatarTable, {
		relationName: "userAvatar"
	}),
	ownerAvatars: many(avatarTable, {
		relationName: "ownerAvatar"
	}),
	styles: many(stylesTable),
	subscriptions: many(subscriptionTable)
}));

export type User = InferSelectModel<typeof userTable>;
export type InsertUser = InferInsertModel<typeof userTable>;
export type Locale = "en" | "es" | "ca";
export type Role = "USER" | "ADMIN";