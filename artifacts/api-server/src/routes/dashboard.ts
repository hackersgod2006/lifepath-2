import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable, tasksTable, moodLogsTable, roomsTable,
  urgeLogsTable, streaksTable
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { computeLifeScore } from "./life-score.js";
import { toStreakResponse, MILESTONES } from "./urges.js";

const SCIENCE_INSIGHTS = [
  { text: "Research from Stanford shows the smallest possible version of a task is always the right place to start.", source: "BJ Fogg, Stanford", module: "procrastination" },
  { text: "The presence of another person working — even silently — activates your brain's accountability systems.", source: "Ned Hallowell, Harvard", module: "body_doubling" },
  { text: "Self-compassion after missing a task predicts recovery. Self-criticism predicts more missing.", source: "Fuschia Sirois, 2014", module: "procrastination" },
  { text: "Pleasure and pain balance like a seesaw. Every day of recovery tips it back toward you.", source: "Anna Lembke, Stanford", module: "addiction" },
];

const PROCRASTINATION_REASONS = {
  low: "You're on track today. Energy and focus are aligned.",
  medium: "A few tasks are backing up. Your first task takes under 5 minutes.",
  high: "High risk of procrastination detected. Time to use the Start Ritual.",
};

const router = Router();

// GET /api/dashboard/summary
router.get("/summary", async (req, res) => {
  try {
    const userId = req.userId!;
    if (!userId) {
      // Return empty state for new users
      return res.json({
        user: null,
        lifeScore: { score: 0, delta: 0, breakdown: { habitCompletion: 0, streakBonus: 0, focusSessions: 0, urgeResistance: 0, moodConsistency: 0 }, updatedAt: new Date().toISOString() },
        todayTasks: [],
        procrastinationRisk: { level: "low", score: 30, reason: PROCRASTINATION_REASONS.low, recommendations: [] },
        activeStreak: null,
        activeRooms: [],
        dailyInsight: SCIENCE_INSIGHTS[0],
        todayMood: null,
      });
    }

    // Fetch all data in parallel
    const [users, lifeScoreData, todayTasks, streaks, rooms, moodLogs] = await Promise.all([
      db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1),
      computeLifeScore(userId),
      db.select().from(tasksTable)
        .where(and(eq(tasksTable.userId, userId), eq(tasksTable.scheduledDate, new Date().toISOString().split("T")[0])))
        .orderBy(tasksTable.createdAt),
      db.select().from(streaksTable).where(eq(streaksTable.userId, userId)).limit(1),
      db.select().from(roomsTable).where(eq(roomsTable.isActive, true)).limit(3),
      db.select().from(moodLogsTable)
        .where(and(eq(moodLogsTable.userId, userId), eq(moodLogsTable.logDate, new Date().toISOString().split("T")[0])))
        .limit(1),
    ]);

    const user = users[0];

    // Procrastination risk
    const pendingTasks = todayTasks.filter(t => t.status === "pending").length;
    const missedTasks = todayTasks.filter(t => t.status === "missed").length;
    const score = Math.min(100, 30 + missedTasks * 15 + (pendingTasks > 5 ? 20 : 0));
    const riskLevel = score < 40 ? "low" : score < 70 ? "medium" : "high";

    // Sort tasks: 2-minute first
    const sortedTasks = [...todayTasks].sort((a, b) => {
      if (a.isTwoMinute && !b.isTwoMinute) return -1;
      if (!a.isTwoMinute && b.isTwoMinute) return 1;
      return 0;
    });

    // Daily insight
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const insight = SCIENCE_INSIGHTS[dayOfYear % SCIENCE_INSIGHTS.length];

    // Build active streak
    let activeStreak = null;
    if (streaks.length) {
      const s = streaks[0];
      const daysSinceStart = Math.floor((Date.now() - s.startedAt.getTime()) / 86400000);
      activeStreak = toStreakResponse(s, daysSinceStart);
    }

    return res.json({
      user: user ? {
        id: user.id,
        name: user.name,
        biggestStruggle: user.biggestStruggle,
        struggleDuration: user.struggleDuration,
        triedBefore: user.triedBefore,
        changeStatement: user.changeStatement,
        addictionType: user.addictionType,
        activeModules: user.activeModules ?? [],
        onboardingComplete: user.onboardingComplete,
        createdAt: user.createdAt.toISOString(),
      } : null,
      lifeScore: {
        score: lifeScoreData.score,
        delta: 0,
        breakdown: {
          habitCompletion: lifeScoreData.habitCompletion,
          streakBonus: lifeScoreData.streakBonus,
          focusSessions: lifeScoreData.focusSessions,
          urgeResistance: lifeScoreData.urgeResistance,
          moodConsistency: lifeScoreData.moodConsistency,
        },
        updatedAt: new Date().toISOString(),
      },
      todayTasks: sortedTasks.map(t => ({
        id: t.id,
        title: t.title,
        microSteps: t.microSteps ?? [],
        status: t.status,
        estimatedMinutes: t.estimatedMinutes,
        isTwoMinute: t.isTwoMinute,
        implementationIntention: t.implementationIntention,
        temptationBundle: t.temptationBundle,
        date: t.scheduledDate,
        completedAt: t.completedAt?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
      })),
      procrastinationRisk: {
        level: riskLevel,
        score,
        reason: PROCRASTINATION_REASONS[riskLevel],
        recommendations: riskLevel === "high" ? ["Start with your smallest task", "Use the 2-minute rule"] : [],
      },
      activeStreak,
      activeRooms: rooms.map(r => ({
        id: r.id,
        name: r.name,
        presenceCount: r.presenceCount,
        isPrivate: r.isPrivate,
        isActive: r.isActive,
        currentSessionMinutes: r.currentSessionMinutes,
        createdAt: r.createdAt.toISOString(),
      })),
      dailyInsight: { id: dayOfYear, ...insight },
      todayMood: moodLogs.length ? {
        id: moodLogs[0].id,
        energy: moodLogs[0].energy,
        focus: moodLogs[0].focus,
        mood: moodLogs[0].mood,
        notes: moodLogs[0].notes,
        date: moodLogs[0].logDate,
        createdAt: moodLogs[0].createdAt.toISOString(),
      } : null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard summary");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
