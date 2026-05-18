import { pgTable, text, serial, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const journalEntriesTable = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").notNull(),
  prompt: text("prompt").notNull(),
  content: text("content").notNull(),
  module: text("module").notNull().default("general"),
  mood: text("mood"),
  entryDate: date("entry_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertJournalEntrySchema = createInsertSchema(journalEntriesTable).omit({ id: true, createdAt: true });
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntriesTable.$inferSelect;
