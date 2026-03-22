import { pgTable, text, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const moodLogs = pgTable(
  "mood_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    moodScore: integer("mood_score"),
    anxietyLevel: integer("anxiety_level"),
    journalEntry: text("journal_entry"),
    triggers: jsonb("triggers").$type<string[]>().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("mood_logs_user_id_idx").on(table.userId)]
);
