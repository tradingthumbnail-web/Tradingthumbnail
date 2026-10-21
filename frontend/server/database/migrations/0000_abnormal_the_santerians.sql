CREATE TABLE "activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" uuid,
	"user_id" uuid,
	"target_type" text DEFAULT 'IMAGE' NOT NULL,
	"target_id" uuid NOT NULL,
	"event_type" text DEFAULT 'image.generated' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"storage_key" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "asset_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "asset_user_favourite" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "avatar" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"storage_key" text NOT NULL,
	"training_metadata" jsonb,
	"status" text DEFAULT 'TRAINING' NOT NULL,
	"gender" text DEFAULT 'OTHER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"trained_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "avatar_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "branch" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"project_id" uuid,
	"root_id" uuid,
	"head_image_id" uuid,
	"default" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "canvas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"data" jsonb NOT NULL,
	"metadata" jsonb,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "canvas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "image" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"state" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"user_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"generation_metadata" jsonb,
	"tool_id" uuid,
	"project_id" uuid,
	"branch_id" uuid,
	"root_id" uuid,
	"parent_id" uuid,
	"depth" integer DEFAULT 0 NOT NULL,
	"ordinal" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"stripe_payment_intent_id" text,
	"stripe_invoice_id" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id"),
	CONSTRAINT "payment_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id")
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"features" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"stripe_product_id" text,
	"stripe_price_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_stripe_product_id_unique" UNIQUE("stripe_product_id"),
	CONSTRAINT "product_stripe_price_id_unique" UNIQUE("stripe_price_id")
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"user_id" uuid NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "project_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "reset_token" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "reset_token_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "style" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"style" jsonb NOT NULL,
	"created_by" uuid,
	"is_public" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tier_id" integer,
	"user_id" uuid,
	"stripe_subscription_id" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tier" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price" numeric NOT NULL,
	"stripe_price_id" text,
	"stripe_product_id" text,
	"avatar_slots" integer NOT NULL,
	"features" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tier_stripe_price_id_unique" UNIQUE("stripe_price_id"),
	CONSTRAINT "tier_stripe_product_id_unique" UNIQUE("stripe_product_id")
);
--> statement-breakpoint
CREATE TABLE "tool" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb,
	"weights_url" text,
	"type" text DEFAULT 'IMAGE' NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"category" text NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{"requiresPrompt":false,"systemPrompt":"","modelConfiguration":{}}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"operation_type" text NOT NULL,
	"target_id" uuid,
	"target_type" text NOT NULL,
	"credits_consumed" integer NOT NULL,
	"avatar_credits_consumed" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"hashed_password" text NOT NULL,
	"credit" integer DEFAULT 0 NOT NULL,
	"avatar_credit" integer DEFAULT 0 NOT NULL,
	"stripe_customer_id" text,
	"role" text DEFAULT 'user' NOT NULL,
	"validation_date" timestamp with time zone,
	"notifications" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_signed_in_at" timestamp with time zone,
	CONSTRAINT "user_username_unique" UNIQUE("username"),
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_user_favourite" ADD CONSTRAINT "asset_user_favourite_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_user_favourite" ADD CONSTRAINT "asset_user_favourite_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "avatar" ADD CONSTRAINT "avatar_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "avatar" ADD CONSTRAINT "avatar_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "branch" ADD CONSTRAINT "branch_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "branch" ADD CONSTRAINT "branch_root_id_image_id_fk" FOREIGN KEY ("root_id") REFERENCES "public"."image"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "branch" ADD CONSTRAINT "branch_head_image_id_image_id_fk" FOREIGN KEY ("head_image_id") REFERENCES "public"."image"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "canvas" ADD CONSTRAINT "canvas_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "image" ADD CONSTRAINT "image_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "image" ADD CONSTRAINT "image_tool_id_tool_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tool"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "image" ADD CONSTRAINT "image_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "image" ADD CONSTRAINT "image_branch_id_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branch"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "image" ADD CONSTRAINT "image_root_id_image_id_fk" FOREIGN KEY ("root_id") REFERENCES "public"."image"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "image" ADD CONSTRAINT "image_parent_id_image_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."image"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "reset_token" ADD CONSTRAINT "reset_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "style" ADD CONSTRAINT "style_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_tier_id_tier_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."tier"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tool" ADD CONSTRAINT "tool_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "usage" ADD CONSTRAINT "usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "project_id_activity_idx" ON "activity" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "user_id_activity_idx" ON "activity" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "target_type_activity_idx" ON "activity" USING btree ("target_type");--> statement-breakpoint
CREATE INDEX "target_id_activity_idx" ON "activity" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX "event_type_activity_idx" ON "activity" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "user_id_asset_idx" ON "asset" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "is_public_asset_idx" ON "asset" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "deleted_at_asset_idx" ON "asset" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "user_id_asset_user_favourite_idx" ON "asset_user_favourite" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "asset_id_asset_user_favourite_idx" ON "asset_user_favourite" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "user_id_avatar_idx" ON "avatar" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "owner_id_avatar_idx" ON "avatar" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "status_avatar_idx" ON "avatar" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gender_avatar_idx" ON "avatar" USING btree ("gender");--> statement-breakpoint
CREATE INDEX "project_id_branch_idx" ON "branch" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "root_id_branch_idx" ON "branch" USING btree ("root_id");--> statement-breakpoint
CREATE INDEX "head_image_id_branch_idx" ON "branch" USING btree ("head_image_id");--> statement-breakpoint
CREATE INDEX "default_branch_idx" ON "branch" USING btree ("default");--> statement-breakpoint
CREATE INDEX "is_locked_branch_idx" ON "branch" USING btree ("is_locked");--> statement-breakpoint
CREATE INDEX "user_id_canvas_idx" ON "canvas" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "slug_canvas_idx" ON "canvas" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "deleted_at_canvas_idx" ON "canvas" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "user_id_image_idx" ON "image" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "project_id_image_idx" ON "image" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "branch_id_image_idx" ON "image" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "root_id_image_idx" ON "image" USING btree ("root_id");--> statement-breakpoint
CREATE INDEX "parent_id_image_idx" ON "image" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "tool_id_image_idx" ON "image" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "user_id_payment_idx" ON "payment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "status_payment_idx" ON "payment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "received_at_payment_idx" ON "payment" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "name_product_idx" ON "product" USING btree ("name");--> statement-breakpoint
CREATE INDEX "user_id_project_idx" ON "project" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "status_project_idx" ON "project" USING btree ("status");--> statement-breakpoint
CREATE INDEX "slug_project_idx" ON "project" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "created_by_style_idx" ON "style" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "is_public_style_idx" ON "style" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "tier_id_subscription_idx" ON "subscription" USING btree ("tier_id");--> statement-breakpoint
CREATE INDEX "user_id_subscription_idx" ON "subscription" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "status_subscription_idx" ON "subscription" USING btree ("status");--> statement-breakpoint
CREATE INDEX "starts_at_subscription_idx" ON "subscription" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "ends_at_subscription_idx" ON "subscription" USING btree ("ends_at");--> statement-breakpoint
CREATE INDEX "name_task_idx" ON "task" USING btree ("name");--> statement-breakpoint
CREATE INDEX "name_tier_idx" ON "tier" USING btree ("name");--> statement-breakpoint
CREATE INDEX "public_tool_idx" ON "tool" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "status_tool_idx" ON "tool" USING btree ("status");--> statement-breakpoint
CREATE INDEX "category_tool_idx" ON "tool" USING btree ("category");--> statement-breakpoint
CREATE INDEX "deleted_at_tool_idx" ON "tool" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "user_id_usage_idx" ON "usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "operation_type_usage_idx" ON "usage" USING btree ("operation_type");--> statement-breakpoint
CREATE INDEX "target_type_usage_idx" ON "usage" USING btree ("target_type");--> statement-breakpoint
CREATE INDEX "target_id_usage_idx" ON "usage" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX "created_at_usage_idx" ON "usage" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "role_user_idx" ON "user" USING btree ("role");