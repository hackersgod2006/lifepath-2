import { Router } from "express";
import { db, journalEntriesTable, usersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const PROMPTS: Record<string, string[]> = {
  procrastination: [
    "What is one task you've been avoiding? What fear sits underneath that avoidance?",
    "Describe a moment you completed something difficult. How did it feel afterwards?",
    "What would your future self thank you for doing today?",
    "What is the smallest possible step you could take on your hardest task right now?",
    "When do you feel most productive? What conditions created that state?",
    "What story are you telling yourself that keeps you from starting?",
    "Who are you becoming through the habits you build today?",
  ],
  compulsive_habits: [
    "What triggered your urge today? Walk through the HALT states: were you Hungry, Angry, Lonely, or Tired?",
    "Describe a moment today where you chose recovery over the habit. How did it feel?",
    "What does your life look like 90 days from now if you stay on this path?",
    "Who in your life would benefit most from your recovery? Write a letter to them.",
    "What void does the compulsive habit fill? What healthy alternative could serve that same need?",
    "Describe the neurological concept of the dopamine seesaw in your own words. How does it apply to your experience?",
    "What are you grateful for today, even in the midst of recovery?",
  ],
  cant_focus: [
    "Describe your ideal focus environment. What does it look like, sound like, feel like?",
    "What is one thing you will accomplish in your next 25-minute focus session?",
    "When did you last experience true flow — losing track of time in meaningful work?",
    "What are the biggest sources of distraction in your day? Which is in your control?",
    "How does social facilitation apply to your work? Who helps you do your best work?",
    "Write an implementation intention for tomorrow: 'When I sit at my desk, I will immediately…'",
    "What meaningful work have you done this week? How did it contribute to your bigger purpose?",
  ],
  general: [
    "What is one thing you did well today? What made it possible?",
    "What is one area where you want to grow? What is one concrete step forward?",
    "How are you feeling emotionally, physically, and mentally right now?",
    "What did you learn today — about yourself, about others, or about the world?",
    "What would make tomorrow a great day?",
    "Write about a challenge you are currently facing. What strengths can you bring to it?",
    "What are three things you are grateful for today?",
  ],
};

function getDailyPrompt(module: string): string {
  const prompts = PROMPTS[module] ?? PROMPTS.general;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return prompts[dayOfYear % prompts.length];
}

// GET /api/journal — list entries (latest 30)
router.get("/", requireAuth, async (req, res) => {
  try {
    const entries = await db.select()
      .from(journalEntriesTable)
      .where(eq(journalEntriesTable.userId, req.userId!))
      .orderBy(desc(journalEntriesTable.createdAt))
      .limit(30);

    return res.json(entries.map(e => ({
      id: e.id,
      prompt: e.prompt,
      content: e.content,
      module: e.module,
      mood: e.mood,
      date: e.entryDate,
      createdAt: e.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to get journal entries");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/journal/prompt — get today's prompt
router.get("/prompt", requireAuth, async (req, res) => {
  try {
    const [user] = await db.select({ biggestStruggle: usersTable.biggestStruggle })
      .from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);

    const module = user?.biggestStruggle ?? "general";
    const prompt = getDailyPrompt(module);

    // Check if already journaled today
    const today = new Date().toISOString().split("T")[0];
    const existing = await db.select({ id: journalEntriesTable.id })
      .from(journalEntriesTable)
      .where(and(
        eq(journalEntriesTable.userId, req.userId!),
        eq(journalEntriesTable.entryDate, today)
      )).limit(1);

    return res.json({
      prompt,
      module,
      alreadyJournaledToday: existing.length > 0,
      date: today,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get journal prompt");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/journal — create entry
router.post("/", requireAuth, async (req, res) => {
  try {
    const { prompt, content, module = "general", mood } = req.body as {
      prompt?: string; content?: string; module?: string; mood?: string;
    };

    if (!prompt || !content) {
      return res.status(400).json({ error: "prompt and content are required" });
    }
    if (content.trim().length < 10) {
      return res.status(400).json({ error: "Entry must be at least 10 characters" });
    }

    const today = new Date().toISOString().split("T")[0];
    const [entry] = await db.insert(journalEntriesTable).values({
      userId: req.userId!,
      prompt,
      content: content.trim(),
      module,
      mood: mood ?? null,
      entryDate: today,
    }).returning();

    return res.status(201).json({
      id: entry.id,
      prompt: entry.prompt,
      content: entry.content,
      module: entry.module,
      mood: entry.mood,
      date: entry.entryDate,
      createdAt: entry.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create journal entry");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/journal/:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params["id"] ?? ""));
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [entry] = await db.select().from(journalEntriesTable)
      .where(and(eq(journalEntriesTable.id, id), eq(journalEntriesTable.userId, req.userId!))).limit(1);

    if (!entry) return res.status(404).json({ error: "Entry not found" });

    await db.delete(journalEntriesTable)
      .where(and(eq(journalEntriesTable.id, id), eq(journalEntriesTable.userId, req.userId!)));

    return res.json({ message: "Deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete journal entry");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export { getDailyPrompt };
export default router;
