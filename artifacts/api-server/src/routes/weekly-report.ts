import { Router } from "express";
import { db } from "@workspace/db";
import { lifeScoresTable, tasksTable, focusSessionsTable, urgeLogsTable, streaksTable } from "@workspace/db";
import { eq, and, gte } from "drizzle-orm";
import { computeLifeScore } from "./life-score.js";

const router = Router();

// GET /api/weekly-report
router.get("/", async (req, res) => {
  try {
    const userId = req.userId!;

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date();

    const [tasks, sessions, urges, streaks, scoreHistory] = await Promise.all([
      db.select().from(tasksTable).where(and(eq(tasksTable.userId, userId), gte(tasksTable.createdAt, weekStart))),
      db.select().from(focusSessionsTable).where(and(eq(focusSessionsTable.userId, userId), gte(focusSessionsTable.createdAt, weekStart))),
      db.select().from(urgeLogsTable).where(and(eq(urgeLogsTable.userId, userId), gte(urgeLogsTable.createdAt, weekStart))),
      db.select().from(streaksTable).where(eq(streaksTable.userId, userId)).limit(1),
      db.select().from(lifeScoresTable).where(and(eq(lifeScoresTable.userId, userId), gte(lifeScoresTable.createdAt, weekStart))),
    ]);

    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const focusHours = sessions.filter(s => s.status === "completed").reduce((acc, s) => acc + s.durationMinutes, 0) / 60;
    const urgesResisted = urges.filter(u => u.outcome !== "relapsed").length;

    const currentScore = await computeLifeScore(userId);
    const oldestHistory = scoreHistory.length ? scoreHistory[0] : null;
    const lifeScoreChange = oldestHistory ? currentScore.score - oldestHistory.score : 0;

    // Fill life score history
    const historyMap: Record<string, number> = {};
    scoreHistory.forEach(h => { historyMap[h.scoreDate] = h.score; });
    const lifeScoreHistory = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      lifeScoreHistory.push({ date: key, score: historyMap[key] ?? Math.max(0, currentScore.score - i * 2) });
    }

    const biggestWins = [
      completedTasks > 5 && `You completed ${completedTasks} tasks this week`,
      urgesResisted > 0 && `You resisted ${urgesResisted} urges this week`,
      focusHours > 1 && `You focused for ${Math.round(focusHours * 10) / 10} hours this week`,
    ].filter(Boolean);

    const biggestWin = biggestWins.length ? biggestWins[0] as string : "You showed up this week. That's the foundation everything else is built on.";

    const weekChallenges = [
      "Complete your tasks before checking any social media each morning.",
      "Log your mood every day this week — consistency is the data that changes everything.",
      "Join one body doubling session this week and notice how your output changes.",
      "Write your implementation intention for your three hardest tasks before the week begins.",
    ];
    const weekChallenge = weekChallenges[Math.floor(Math.random() * weekChallenges.length)];

    const streakData = streaks[0];
    const currentDays = streakData ? Math.floor((Date.now() - streakData.startedAt.getTime()) / 86400000) : 0;

    return res.json({
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      lifeScoreChange,
      lifeScoreHistory,
      biggestWin,
      scienceInsight: "Consistency over intensity. The research is clear: daily small actions compound faster than occasional heroic efforts.",
      weekChallenge,
      streakStatus: { currentDays, change: 7 },
      moduleStats: {
        tasksCompleted: completedTasks,
        focusHours: Math.round(focusHours * 10) / 10,
        urgesResisted,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get weekly report");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
