import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const urgeLogsTable = pgTable("urge_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  haltState: text("halt_state").array().default([]).notNull(), // hungry | angry | lonely | tired
  intensity: integer("intensity").notNull(), // 1-10
  outcome: text("outcome").notNull().default("resisted"), // resisted | surfed | redirected | relapsed
  redirectActivity: text("redirect_activity"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUrgeLogSchema = createInsertSchema(urgeLogsTable).omit({ id: true, createdAt: true });
export type InsertUrgeLog = z.infer<typeof insertUrgeLogSchema>;
export type UrgeLog = typeof urgeLogsTable.$inferSelect;
