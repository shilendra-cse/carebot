import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const medicalHistory = pgTable(
  "medical_history",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    condition: text("condition").notNull(),
    diagnosisDate: timestamp("diagnosis_date"),
    treatment: text("treatment"),
    doctor: text("doctor"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("medical_history_user_id_idx").on(table.userId)]
);

export const allergies = pgTable(
  "allergies",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    allergen: text("allergen").notNull(),
    reaction: text("reaction"),
    severity: text("severity"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("allergies_user_id_idx").on(table.userId)]
);
