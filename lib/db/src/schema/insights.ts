import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const insightsTable = pgTable("insights", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  source: text("source").notNull(),
  module: text("module").notNull(), // procrastination | addiction | body_doubling | general
  displayedCount: integer("displayed_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Insight = typeof insightsTable.$inferSelect;
