import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const focusSessionsTable = pgTable("focus_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  roomId: integer("room_id"),
  intention: text("intention").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  musicType: text("music_type"),
  status: text("status").notNull().default("active"), // active | completed | abandoned
  focusQuality: integer("focus_quality"), // 1-5
  taskCompleted: boolean("task_completed"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFocusSessionSchema = createInsertSchema(focusSessionsTable).omit({ id: true, createdAt: true });
export type InsertFocusSession = z.infer<typeof insertFocusSessionSchema>;
export type FocusSession = typeof focusSessionsTable.$inferSelect;
