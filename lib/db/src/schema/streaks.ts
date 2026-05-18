import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const streaksTable = pgTable("streaks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  addictionType: text("addiction_type").notNull(),
  currentDays: integer("current_days").notNull().default(0),
  longestDays: integer("longest_days").notNull().default(0),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStreakSchema = createInsertSchema(streaksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStreak = z.infer<typeof insertStreakSchema>;
export type Streak = typeof streaksTable.$inferSelect;
