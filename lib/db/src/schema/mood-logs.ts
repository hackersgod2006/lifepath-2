import { pgTable, text, serial, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const moodLogsTable = pgTable("mood_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  energy: integer("energy").notNull(), // 1-5
  focus: integer("focus").notNull(),   // 1-5
  mood: integer("mood").notNull(),     // 1-5
  notes: text("notes"),
  logDate: date("log_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMoodLogSchema = createInsertSchema(moodLogsTable).omit({ id: true, createdAt: true });
export type InsertMoodLog = z.infer<typeof insertMoodLogSchema>;
export type MoodLog = typeof moodLogsTable.$inferSelect;
