import { pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const chats = pgTable(
  "chats",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New Chat"),
    messages: jsonb("messages").default([]).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("chats_user_id_idx").on(table.userId)]
);