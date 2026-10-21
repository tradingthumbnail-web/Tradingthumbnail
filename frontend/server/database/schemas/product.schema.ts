import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { pgTable, timestamp, uuid, text, index, jsonb } from "drizzle-orm/pg-core";

import type { Locale } from "./user.schema";

export const productTable = pgTable("product", {
    id: uuid("id").primaryKey().defaultRandom(),
    
    name: text("name").notNull(),
    features: jsonb("features").notNull().default({}).$type<Features>(),

    stripeProductId: text("stripe_product_id").unique(),
    stripePriceId: text("stripe_price_id").unique(),
    polarProductId: text("polar_product_id").unique(),
    polarPriceId: text("polar_price_id").unique(),

    metadata: jsonb("metadata").notNull().default({}).$type<ProductMetadata>(),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
}, (table) => [
    index("name_product_idx").on(table.name),
]);

export type Product = InferSelectModel<typeof productTable>;
export type InsertProduct = InferInsertModel<typeof productTable>;

export type ProductMetadata = {
    credits?: number;
    avatarCredits?: number;
};

export type Features = {
    [key in Locale]: string[];
};