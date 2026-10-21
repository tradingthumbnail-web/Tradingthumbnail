import { InferSelectModel, InferInsertModel, relations } from "drizzle-orm";
import { pgTable, timestamp, uuid, text, index, jsonb, serial, integer } from "drizzle-orm/pg-core";

import { userTable } from "./user.schema";

export const paymentTable = pgTable("payment", {
    id: serial("id").primaryKey(),
    
    userId: uuid("user_id")
        .references(() => userTable.id, { onDelete: 'set null', onUpdate: 'cascade' }),

    stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
    stripeInvoiceId: text("stripe_invoice_id").unique(),
    polarOrderId: text("polar_order_id").unique(),
    polarCheckoutId: text("polar_checkout_id").unique(),

    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("USD"),

    status: text("status").notNull().default("PENDING").$type<PaymentStatus>(),

    metadata: jsonb("metadata").notNull().default({}),
    receivedAt: timestamp("received_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (table) => [
    index("user_id_payment_idx").on(table.userId),
    index("status_payment_idx").on(table.status),
    index("received_at_payment_idx").on(table.receivedAt),
]);

export const paymentRelations = relations(paymentTable, ({ one }) => ({
    user: one(userTable, {
        fields: [paymentTable.userId],
        references: [userTable.id],
    }),
}));

export type Payment = InferSelectModel<typeof paymentTable>;
export type InsertPayment = InferInsertModel<typeof paymentTable>;
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";