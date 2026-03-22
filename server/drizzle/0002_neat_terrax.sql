ALTER TABLE "chats" ADD COLUMN "title" text DEFAULT 'New Chat' NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;