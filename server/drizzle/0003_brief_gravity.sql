ALTER TABLE "user" ADD COLUMN "date_of_birth" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "height" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "weight" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "blood_type" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "onboarding_completed" boolean DEFAULT false NOT NULL;