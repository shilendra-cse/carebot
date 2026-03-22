import { pgTable, text, timestamp, boolean, time, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const appointments = pgTable(
  "appointments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    doctorName: text("doctor_name").notNull(),
    specialty: text("specialty"),
    date: timestamp("date").notNull(),
    time: time("time"),
    location: text("location"),
    reason: text("reason"),
    notes: text("notes"),
    status: text("status").default("scheduled"),
    reminderSent: boolean("reminder_sent").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("appointments_user_id_idx").on(table.userId),
    index("appointments_date_idx").on(table.date),
  ]
);
