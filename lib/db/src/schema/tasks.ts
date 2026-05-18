import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tasksTable = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  microSteps: text("micro_steps").array().default([]).notNull(),
  status: text("status").notNull().default("pending"), // pending | completed | missed | snoozed
  estimatedMinutes: integer("estimated_minutes"),
  isTwoMinute: boolean("is_two_minute").default(false).notNull(),
  implementationIntention: text("implementation_intention"),
  temptationBundle: text("temptation_bundle"),
  scheduledDate: date("scheduled_date").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTaskSchema = createInsertSchema(tasksTable).omit({ id: true, createdAt: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasksTable.$inferSelect;
