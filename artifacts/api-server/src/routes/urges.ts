import { Router } from "express";
import { db } from "@workspace/db";
import { urgeLogsTable, streaksTable } from "@workspace/db";
import { eq, and, gte, desc } from "drizzle-orm";
import { LogUrgeBody, LogRelapseBody } from "@workspace/api-zod";

const router = Router();

const MILESTONES = [
  { day: 3, label: "Day 3 — First Shift", scienceFact: "Dopamine receptor sensitivity begins to change. Your brain is already adapting." },
  { day: 7, label: "Day 7 — Peak and Through", scienceFact: "Withdrawal symptoms typically peak then subside. You have made it through the hardest phase." },
  { day: 14, label: "Day 14 — Prefrontal Surge", scienceFact: "Measurable increases in prefrontal cortex activity. Your decision-making circuits are strengthening." },
  { day: 30, label: "Day 30 — Baseline Reset", scienceFact: "Dopamine baseline approaching pre-addiction levels. Your brain is recalibrating its reward system." },
  { day: 60, label: "Day 60 — Deep Repair", scienceFact: "Structural changes in neural pathways documented in fMRI studies. Real, physical healing." },
  { day: 90, label: "Day 90 — New Foundation", scienceFact: "Sustained brain changes documented. Most cravings have become background noise. You have rebuilt." },
];

function toUrgeResponse(u: typeof urgeLogsTable.$inferSelect) {
  return {
    id: u.id,
    haltState: u.haltState ?? [],
    intensity: u.intensity,
    outcome: u.outcome,
    redirectActivity: u.redirectActivity,
    notes: u.notes,
    createdAt: u.createdAt.toISOString(),
  };
}

function toStreakResponse(s: typeof streaksTable.$inferSelect, currentDays: number) {
  const nextMilestone = MILESTONES.find(m => m.day > currentDays) ?? MILESTONES[MILESTONES.length - 1];
  const dopamineRecoveryPercent = Math.min(100, (currentDays / 90) * 100);
  const neuroBrainFact = MILESTONES.find(m => m.day <= currentDays)?.scienceFact ?? null;

  return {
    currentDays,
    longestDays: s.longestDays,
    addictionType: s.addictionType,
    startedAt: s.startedAt.toISOString(),
    nextMilestone: { ...nextMilestone, achieved: false, achievedAt: null },
    milestones: MILESTONES.map(m => ({
      ...m,
      achieved: currentDays >= m.day,
      achievedAt: currentDays >= m.day ? new Date(s.startedAt.getTime() + m.day * 86400000).toISOString() : null,
    })),
    dopamineRecoveryPercent,
    neuroBrainFact,
  };
}

// GET /api/urges
router.get("/", async (req, res) => {
  try {
    const userId = req.userId!;

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const urges = await db.select().from(urgeLogsTable)
      .where(eq(urgeLogsTable.userId, userId))
      .orderBy(desc(urgeLogsTable.createdAt))
      .limit(limit);

    return res.json(urges.map(toUrgeResponse));
  } catch (err) {
    req.log.error({ err }, "Failed to get urges");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/urges
router.post("/", async (req, res) => {
  try {
    const userId = req.userId!;

    const parsed = LogUrgeBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid urge data" });

    const { haltState, intensity, outcome, redirectActivity, notes } = parsed.data;

    const [urge] = await db.insert(urgeLogsTable).values({
      userId,
      haltState: haltState ?? [],
      intensity,
      outcome: outcome ?? "resisted",
      redirectActivity: redirectActivity ?? null,
      notes: notes ?? null,
    }).returning();

    return res.status(201).json(toUrgeResponse(urge));
  } catch (err) {
    req.log.error({ err }, "Failed to log urge");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/urges/trigger-map
router.get("/trigger-map", async (req, res) => {
  try {
    const userId = req.userId!;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const urges = await db.select().from(urgeLogsTable)
      .where(and(eq(urgeLogsTable.userId, userId), gte(urgeLogsTable.createdAt, thirtyDaysAgo)));

    const haltBreakdown = { hungry: 0, angry: 0, lonely: 0, tired: 0 };
    urges.forEach(u => {
      (u.haltState ?? []).forEach(h => {
        if (h in haltBreakdown) haltBreakdown[h as keyof typeof haltBreakdown]++;
      });
    });

    const hourlyMap: Record<number, number> = {};
    urges.forEach(u => {
      const h: number = u.createdAt.getHours();
      hourlyMap[h] = (hourlyMap[h] ?? 0) + 1;
    });
    const hourlyPattern = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: hourlyMap[i] ?? 0 }));

    const resisted = urges.filter(u => u.outcome !== "relapsed").length;
    const resistanceRate = urges.length ? resisted / urges.length : 0;

    return res.json({ haltBreakdown, hourlyPattern, totalUrges: urges.length, resistanceRate });
  } catch (err) {
    req.log.error({ err }, "Failed to get trigger map");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/streaks
router.get("/streaks", async (req, res) => {
  try {
    const userId = req.userId!;

    const streaks = await db.select().from(streaksTable).where(eq(streaksTable.userId, userId)).limit(1);
    if (!streaks.length) {
      // Return a default streak
      return res.json({
        currentDays: 0,
        longestDays: 0,
        addictionType: "social_media",
        startedAt: new Date().toISOString(),
        nextMilestone: { ...MILESTONES[0], achieved: false, achievedAt: null },
        milestones: MILESTONES.map(m => ({ ...m, achieved: false, achievedAt: null })),
        dopamineRecoveryPercent: 0,
        neuroBrainFact: null,
      });
    }

    const streak = streaks[0];
    const daysSinceStart = Math.floor((Date.now() - streak.startedAt.getTime()) / 86400000);
    return res.json(toStreakResponse(streak, daysSinceStart));
  } catch (err) {
    req.log.error({ err }, "Failed to get streak");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/streaks/relapse
router.post("/streaks/relapse", async (req, res) => {
  try {
    const userId = req.userId!;

    const streaks = await db.select().from(streaksTable).where(eq(streaksTable.userId, userId)).limit(1);

    if (streaks.length) {
      const current = streaks[0];
      const daysSinceStart = Math.floor((Date.now() - current.startedAt.getTime()) / 86400000);
      const newLongest = Math.max(current.longestDays, daysSinceStart);

      const [updated] = await db.update(streaksTable)
        .set({ currentDays: 0, longestDays: newLongest, startedAt: new Date(), updatedAt: new Date() })
        .where(eq(streaksTable.id, current.id))
        .returning();

      return res.json(toStreakResponse(updated, 0));
    }

    return res.status(404).json({ error: "No active streak" });
  } catch (err) {
    req.log.error({ err }, "Failed to log relapse");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export { toStreakResponse, MILESTONES };
export default router;
