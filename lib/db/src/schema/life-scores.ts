import { pgTable, serial, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const lifeScoresTable = pgTable("life_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  score: integer("score").notNull().default(35),
  habitCompletion: integer("habit_completion").notNull().default(0),
  streakBonus: integer("streak_bonus").notNull().default(0),
  focusSessions: integer("focus_sessions").notNull().default(0),
  urgeResistance: integer("urge_resistance").notNull().default(0),
  moodConsistency: integer("mood_consistency").notNull().default(0),
  scoreDate: date("score_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLifeScoreSchema = createInsertSchema(lifeScoresTable).omit({ id: true, createdAt: true });
export type InsertLifeScore = z.infer<typeof insertLifeScoreSchema>;
export type LifeScore = typeof lifeScoresTable.$inferSelect;
