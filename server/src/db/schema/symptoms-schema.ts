import { pgTable, text, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const symptoms = pgTable(
  "symptoms",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    severity: integer("severity"),
    duration: text("duration"),
    bodyPart: text("body_part"),
    notes: text("notes"),
    analyzed: boolean("analyzed").default(false),
    analysisResult: text("analysis_result"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("symptoms_user_id_idx").on(table.userId)]
);
