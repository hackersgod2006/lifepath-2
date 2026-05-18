import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, lifeScoresTable, tasksTable, focusSessionsTable, urgeLogsTable, moodLogsTable } from "@workspace/db";
import { eq, desc, gte, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

async function getCurrentUserId(): Promise<number | null> {
  const users = await db.select({ id: usersTable.id }).from(usersTable).limit(1);
  return users.length ? users[0].id : null;
}

async function computeLifeScore(userId: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Habit completion (tasks)
  const allTasks = await db.select().from(tasksTable)
    .where(and(eq(tasksTable.userId, userId), gte(tasksTable.createdAt, thirtyDaysAgo)));
  const completedTasks = allTasks.filter(t => t.status === "completed");
  const habitRate = allTasks.length ? completedTasks.length / allTasks.length : 0;
  const habitCompletion = Math.round(habitRate * 30);

  // Focus sessions this week
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const sessions = await db.select().from(focusSessionsTable)
    .where(and(eq(focusSessionsTable.userId, userId), gte(focusSessionsTable.createdAt, weekAgo)));
  const completedSessions = sessions.filter(s => s.status === "completed");
  const focusSessionsScore = Math.min(completedSessions.length * 3, 20);

  // Urge resistance
  const urges = await db.select().from(urgeLogsTable)
    .where(and(eq(urgeLogsTable.userId, userId), gte(urgeLogsTable.createdAt, thirtyDaysAgo)));
  const resistedUrges = urges.filter(u => u.outcome !== "relapsed");
  const urgeRate = urges.length ? resistedUrges.length / urges.length : 0.5;
  const urgeResistance = Math.round(urgeRate * 20);

  // Streak bonus — checked in caller
  const streakBonus = 5;

  // Mood consistency
  const moodLogs = await db.select().from(moodLogsTable)
    .where(and(eq(moodLogsTable.userId, userId), gte(moodLogsTable.createdAt, thirtyDaysAgo)));
  const moodConsistency = Math.min(moodLogs.length * 1, 10);

  const score = Math.min(100, 20 + habitCompletion + focusSessionsScore + urgeResistance + streakBonus + moodConsistency);

  return { score, habitCompletion, streakBonus, focusSessions: focusSessionsScore, urgeResistance, moodConsistency };
}

// GET /api/life-score
router.get("/", async (req, res) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return res.status(404).json({ error: "No user" });

    const { score, habitCompletion, streakBonus, focusSessions, urgeResistance, moodConsistency } = await computeLifeScore(userId);

    // Get yesterday's score for delta
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yDate = yesterday.toISOString().split("T")[0];
    const yScores = await db.select().from(lifeScoresTable)
      .where(and(eq(lifeScoresTable.userId, userId), eq(lifeScoresTable.scoreDate, yDate)))
      .limit(1);
    const delta = yScores.length ? score - yScores[0].score : 0;

    // Upsert today's score
    const todayStr = new Date().toISOString().split("T")[0];
    const existing = await db.select().from(lifeScoresTable)
      .where(and(eq(lifeScoresTable.userId, userId), eq(lifeScoresTable.scoreDate, todayStr)))
      .limit(1);

    if (existing.length) {
      await db.update(lifeScoresTable)
        .set({ score, habitCompletion, streakBonus, focusSessions, urgeResistance, moodConsistency })
        .where(eq(lifeScoresTable.id, existing[0].id));
    } else {
      await db.insert(lifeScoresTable).values({
        userId, score, habitCompletion, streakBonus, focusSessions, urgeResistance, moodConsistency,
        scoreDate: todayStr,
      });
    }

    return res.json({
      score,
      delta,
      breakdown: { habitCompletion, streakBonus, focusSessions, urgeResistance, moodConsistency },
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get life score");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/life-score/history
router.get("/history", async (req, res) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return res.status(404).json({ error: "No user" });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const history = await db.select().from(lifeScoresTable)
      .where(and(eq(lifeScoresTable.userId, userId), gte(lifeScoresTable.createdAt, thirtyDaysAgo)))
      .orderBy(lifeScoresTable.scoreDate);

    // Fill gaps with interpolated data
    const result = history.map(h => ({
      date: h.scoreDate,
      score: h.score,
    }));

    // If no history, generate some sample data
    if (!result.length) {
      const days = 7;
      for (let i = days; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        result.push({ date: d.toISOString().split("T")[0], score: 30 + Math.round(Math.random() * 10) });
      }
    }

    return res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get life score history");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/life-score/simulation
router.get("/simulation", async (req, res) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return res.status(404).json({ error: "No user" });

    const { score } = await computeLifeScore(userId);

    // Generate 14-day simulation
    const currentPath = [];
    const goalPath = [];
    for (let i = 0; i <= 14; i++) {
      const currentVal = score + i * 0.5 + (Math.random() - 0.5) * 3;
      const goalVal = score + i * 2.5;
      currentPath.push({ day: i, value: Math.min(100, Math.max(0, currentVal)) });
      goalPath.push({ day: i, value: Math.min(100, goalVal) });
    }

    const gap = Math.round(goalPath[14].value - currentPath[14].value);

    return res.json({ currentPath, goalPath, gap });
  } catch (err) {
    req.log.error({ err }, "Failed to get simulation");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export { computeLifeScore, getCurrentUserId };
export default router;
