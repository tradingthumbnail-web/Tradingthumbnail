import { InferSelectModel, InferInsertModel} from "drizzle-orm";
import { pgTable, text, integer, timestamp, jsonb, uuid, decimal, index, serial } from "drizzle-orm/pg-core";

import type { Locale } from "./user.schema";

export const tierTable = pgTable("tier", {
	id: serial("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description").notNull(),

	price: decimal("price").notNull(),
	stripePriceId: text("stripe_price_id").unique(),
	stripeProductId: text("stripe_product_id").unique(),
	polarPriceId: text("polar_price_id").unique(),
	polarProductId: text("polar_product_id").unique(),
	polarYearlyProductId: text("polar_yearly_product_id").unique(),
	
	avatarSlots: integer("avatar_slots").notNull(),
    features: jsonb("features").notNull().default({}).$type<Features>(),
	
	createdAt: timestamp("created_at", {
		withTimezone: true,
		mode: "date"
	}).notNull().defaultNow(),
}, (table) => [
    index("name_tier_idx").on(table.name),
]);

export type Tier = InferSelectModel<typeof tierTable>;
export type InsertTier = InferInsertModel<typeof tierTable>;
export type Features = {
	maxCredits: number;
	displayFeatures: AppFeatures[];
	features?: {
		[key in Locale]: string[];
	}
};

export type AppFeatures = "INPAINTING" | "IMAGE_TO_IMAGE" | "CHARACTERS" | "BACKGROUNDS" | "PORTRAIT_MODE" | "SEND_AVATARS";