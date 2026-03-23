import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"),
  image: text("image"),
  dateOfBirth: timestamp("date_of_birth"),
  gender: text("gender"),
  height: text("height"),
  weight: text("weight"),
  bloodType: text("blood_type"),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
