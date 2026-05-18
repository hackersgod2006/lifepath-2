import { Router } from "express";
import { db } from "@workspace/db";
import { moodLogsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { LogMoodBody } from "@workspace/api-zod";
import { getCurrentUserId } from "./life-score.js";

const router = Router();

function toMoodResponse(m: typeof moodLogsTable.$inferSelect) {
  return {
    id: m.id,
    energy: m.energy,
    focus: m.focus,
    mood: m.mood,
    notes: m.notes,
    date: m.logDate,
    createdAt: m.createdAt.toISOString(),
  };
}

// POST /api/mood
router.post("/", async (req, res) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return res.status(404).json({ error: "No user" });

    const parsed = LogMoodBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid mood data" });

    const { energy, focus, mood, notes } = parsed.data;
    const today = new Date().toISOString().split("T")[0];

    // Upsert today's mood
    const existing = await db.select().from(moodLogsTable)
      .where(and(eq(moodLogsTable.userId, userId), eq(moodLogsTable.logDate, today)))
      .limit(1);

    let log;
    if (existing.length) {
      const [updated] = await db.update(moodLogsTable)
        .set({ energy, focus, mood, notes: notes ?? null })
        .where(eq(moodLogsTable.id, existing[0].id))
        .returning();
      log = updated;
    } else {
      const [created] = await db.insert(moodLogsTable)
        .values({ userId, energy, focus, mood, notes: notes ?? null, logDate: today })
        .returning();
      log = created;
    }

    return res.status(201).json(toMoodResponse(log));
  } catch (err) {
    req.log.error({ err }, "Failed to log mood");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/mood/today
router.get("/today", async (req, res) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return res.status(404).json({ error: "No user" });

    const today = new Date().toISOString().split("T")[0];
    const logs = await db.select().from(moodLogsTable)
      .where(and(eq(moodLogsTable.userId, userId), eq(moodLogsTable.logDate, today)))
      .limit(1);

    if (!logs.length) return res.status(404).json({ error: "No mood logged today" });
    return res.json(toMoodResponse(logs[0]));
  } catch (err) {
    req.log.error({ err }, "Failed to get today's mood");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
