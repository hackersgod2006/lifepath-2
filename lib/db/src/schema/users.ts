import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  biggestStruggle: text("biggest_struggle"),
  struggleDuration: text("struggle_duration"),
  triedBefore: text("tried_before"),
  changeStatement: text("change_statement"),
  addictionType: text("addiction_type"),
  activeModules: text("active_modules").array().default([]).notNull(),
  onboardingComplete: boolean("onboarding_complete").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
