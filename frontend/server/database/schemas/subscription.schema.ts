import { InferSelectModel, InferInsertModel, relations } from "drizzle-orm";
import { pgTable, timestamp, uuid, text, index, integer } from "drizzle-orm/pg-core";

import { tierTable } from "./tier.schema";
import { userTable } from "./user.schema";

export const subscriptionTable = pgTable("subscription", {
    id: uuid("id").primaryKey().defaultRandom(),
    
    tierId: integer("tier_id")
        .references(() => tierTable.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    userId: uuid("user_id")
        .references(() => userTable.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    polarSubscriptionId: text("polar_subscription_id").unique(),
    status: text("status").notNull().default("ACTIVE").$type<SubscriptionStatus>(),

    startsAt: timestamp("starts_at", { withTimezone: true, mode: "date" }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true, mode: "date" }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (table) => [
    index("tier_id_subscription_idx").on(table.tierId),
    index("user_id_subscription_idx").on(table.userId),
    index("status_subscription_idx").on(table.status),
    index("starts_at_subscription_idx").on(table.startsAt),
    index("ends_at_subscription_idx").on(table.endsAt),
]);

export const subscriptionRelations = relations(subscriptionTable, ({ one }) => ({
    tier: one(tierTable, {
        fields: [subscriptionTable.tierId],
        references: [tierTable.id],
    }),
    user: one(userTable, {
        fields: [subscriptionTable.userId],
        references: [userTable.id],
    }),
}));

export type Subscription = InferSelectModel<typeof subscriptionTable>;
export type InsertSubscription = InferInsertModel<typeof subscriptionTable>;

export type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "EXPIRED" | "PAST_DUE";