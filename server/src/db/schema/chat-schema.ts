import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const chats = pgTable("chats", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .references(() => user.id, { onDelete: "cascade" }),
    messages: jsonb("messages").default([]).notNull(),
    updatedAt: timestamp("updated_at").defaultNow()
});