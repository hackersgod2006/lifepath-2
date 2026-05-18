import { Router } from "express";
import { db } from "@workspace/db";
import { focusSessionsTable } from "@workspace/db";
import { eq, and, gte, desc } from "drizzle-orm";
import { StartSessionBody, CompleteSessionBody } from "@workspace/api-zod";
import { getCurrentUserId } from "./life-score.js";

const router = Router();

function toSessionResponse(s: typeof focusSessionsTable.$inferSelect) {
  return {
    id: s.id,
    intention: s.intention,
    durationMinutes: s.durationMinutes,
    musicType: s.musicType,
    status: s.status,
    focusQuality: s.focusQuality,
    taskCompleted: s.taskCompleted,
    completedAt: s.completedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}

// GET /api/sessions
router.get("/", async (req, res) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return res.status(404).json({ error: "No user" });

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const sessions = await db.select().from(focusSessionsTable)
      .where(eq(focusSessionsTable.userId, userId))
      .orderBy(desc(focusSessionsTable.createdAt))
      .limit(limit);

    return res.json(sessions.map(toSessionResponse));
  } catch (err) {
    req.log.error({ err }, "Failed to get sessions");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/sessions
router.post("/", async (req, res) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return res.status(404).json({ error: "No user" });

    const parsed = StartSessionBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid session data" });

    const { intention, durationMinutes, musicType, roomId } = parsed.data;

    const [session] = await db.insert(focusSessionsTable).values({
      userId,
      roomId: roomId ?? null,
      intention,
      durationMinutes,
      musicType: musicType ?? null,
      status: "active",
    }).returning();

    return res.status(201).json(toSessionResponse(session));
  } catch (err) {
    req.log.error({ err }, "Failed to start session");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/sessions/:id/complete
router.post("/:id/complete", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const parsed = CompleteSessionBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid data" });

    const { taskCompleted, focusQuality } = parsed.data;

    const [updated] = await db.update(focusSessionsTable)
      .set({ status: "completed", taskCompleted, focusQuality, completedAt: new Date() })
      .where(eq(focusSessionsTable.id, sessionId))
      .returning();

    if (!updated) return res.status(404).json({ error: "Session not found" });
    return res.json(toSessionResponse(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to complete session");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/sessions/stats
router.get("/stats", async (req, res) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return res.status(404).json({ error: "No user" });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const sessions = await db.select().from(focusSessionsTable)
      .where(and(eq(focusSessionsTable.userId, userId), gte(focusSessionsTable.createdAt, weekAgo)));

    const completed = sessions.filter(s => s.status === "completed");
    const totalHours = completed.reduce((acc, s) => acc + s.durationMinutes, 0) / 60;
    const avgQuality = completed.length && completed.some(s => s.focusQuality)
      ? completed.filter(s => s.focusQuality).reduce((acc, s) => acc + (s.focusQuality ?? 0), 0) / completed.filter(s => s.focusQuality).length
      : null;

    return res.json({
      totalSessionsThisWeek: completed.length,
      totalHoursThisWeek: Math.round(totalHours * 10) / 10,
      bestStreak: completed.length,
      mostProductiveHour: null,
      averageFocusQuality: avgQuality ? Math.round(avgQuality * 10) / 10 : null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get session stats");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
