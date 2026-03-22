import { pgTable, text, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const medications = pgTable(
  "medications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    dosage: text("dosage").notNull(),
    frequency: text("frequency").notNull(),
    times: jsonb("times").$type<string[]>().default([]),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    active: boolean("active").default(true).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("medications_user_id_idx").on(table.userId)]
);

export const medicationLogs = pgTable(
  "medication_logs",
  {
    id: text("id").primaryKey(),
    medicationId: text("medication_id").references(() => medications.id, {
      onDelete: "cascade",
    }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    scheduledTime: timestamp("scheduled_time").notNull(),
    takenAt: timestamp("taken_at"),
    skipped: boolean("skipped").default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("medication_logs_user_id_idx").on(table.userId),
    index("medication_logs_medication_id_idx").on(table.medicationId),
  ]
);
