ALTER TABLE "image" ADD COLUMN "type" text DEFAULT 'GENERATION' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "locale" text DEFAULT 'en';