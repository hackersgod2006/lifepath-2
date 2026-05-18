import { Router } from "express";
import { db } from "@workspace/db";
import { tasksTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { CreateTaskBody, UpdateTaskBody } from "@workspace/api-zod";

const router = Router();

function toTaskResponse(t: typeof tasksTable.$inferSelect) {
  return {
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
  };
}

function generateMicroSteps(title: string): string[] {
  // Simple micro-step generation based on common patterns
  const lower = title.toLowerCase();
  if (lower.includes("write") || lower.includes("essay") || lower.includes("report")) {
    return ["Open the document", "Write the first sentence", "Write one paragraph", "Review what you wrote"];
  }
  if (lower.includes("email") || lower.includes("message")) {
    return ["Open your email client", "Type the recipient's name", "Write the subject line", "Write one sentence"];
  }
  if (lower.includes("exercise") || lower.includes("workout") || lower.includes("gym")) {
    return ["Put on workout clothes", "Get your water bottle", "Start with 5 minutes only"];
  }
  if (lower.includes("read") || lower.includes("book") || lower.includes("study")) {
    return ["Open the book or material", "Read just one page", "Take one note"];
  }
  return ["Gather what you need", "Start with the first small action", "Complete the core part"];
}

// GET /api/tasks
router.get("/", async (req, res) => {
  try {
    const userId = req.userId!;

    const dateParam = req.query.date as string | undefined;
    const targetDate = dateParam ?? new Date().toISOString().split("T")[0];

    const tasks = await db.select().from(tasksTable)
      .where(and(eq(tasksTable.userId, userId), eq(tasksTable.scheduledDate, targetDate)))
      .orderBy(tasksTable.createdAt);

    // Sort: 2-minute tasks first, then pending, then completed/missed
    const sorted = [...tasks].sort((a, b) => {
      if (a.isTwoMinute && !b.isTwoMinute) return -1;
      if (!a.isTwoMinute && b.isTwoMinute) return 1;
      const order = { pending: 0, snoozed: 1, completed: 2, missed: 3 };
      return (order[a.status as keyof typeof order] ?? 0) - (order[b.status as keyof typeof order] ?? 0);
    });

    return res.json(sorted.map(toTaskResponse));
  } catch (err) {
    req.log.error({ err }, "Failed to get tasks");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/tasks
router.post("/", async (req, res) => {
  try {
    const userId = req.userId!;

    const parsed = CreateTaskBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid task data" });

    const { title, estimatedMinutes, implementationIntention, temptationBundle, scheduledDate } = parsed.data;
    const isTwoMinute = !!estimatedMinutes && estimatedMinutes <= 2;
    const microSteps = generateMicroSteps(title);
    const date = scheduledDate ?? new Date().toISOString().split("T")[0];

    const [task] = await db.insert(tasksTable).values({
      userId,
      title,
      microSteps,
      status: "pending",
      estimatedMinutes: estimatedMinutes ?? null,
      isTwoMinute,
      implementationIntention: implementationIntention ?? null,
      temptationBundle: temptationBundle ?? null,
      scheduledDate: date,
    }).returning();

    return res.status(201).json(toTaskResponse(task));
  } catch (err) {
    req.log.error({ err }, "Failed to create task");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/tasks/:id
router.patch("/:id", async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const parsed = UpdateTaskBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid update data" });

    const { status, title, implementationIntention, temptationBundle } = parsed.data;

    const [updated] = await db.update(tasksTable)
      .set({
        ...(status && { status }),
        ...(title && { title }),
        ...(implementationIntention !== undefined && { implementationIntention }),
        ...(temptationBundle !== undefined && { temptationBundle }),
        ...(status === "completed" && { completedAt: new Date() }),
      })
      .where(eq(tasksTable.id, taskId))
      .returning();

    if (!updated) return res.status(404).json({ error: "Task not found" });
    return res.json(toTaskResponse(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update task");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    await db.delete(tasksTable).where(eq(tasksTable.id, taskId));
    return res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete task");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/tasks/risk-score
router.get("/risk-score", async (req, res) => {
  try {
    const userId = req.userId!;

    const today = new Date().toISOString().split("T")[0];
    const todayTasks = await db.select().from(tasksTable)
      .where(and(eq(tasksTable.userId, userId), eq(tasksTable.scheduledDate, today)));

    const missedToday = todayTasks.filter(t => t.status === "missed").length;
    const totalToday = todayTasks.length;
    const completedToday = todayTasks.filter(t => t.status === "completed").length;

    const hour = new Date().getHours();
    const isLateDay = hour >= 16;
    const completionRate = totalToday ? completedToday / totalToday : 0;

    let score = 50;
    if (missedToday > 0) score += missedToday * 15;
    if (isLateDay && completionRate < 0.3) score += 20;
    if (completionRate > 0.7) score -= 25;
    score = Math.max(0, Math.min(100, score));

    const level = score < 40 ? "low" : score < 70 ? "medium" : "high";
    const reasons: Record<string, string> = {
      low: "You're on track today. Energy and focus are aligned.",
      medium: "A few tasks are backing up. Your first task takes under 5 minutes.",
      high: "High risk of procrastination detected. Time to use the Start Ritual.",
    };

    return res.json({
      level,
      score,
      reason: reasons[level],
      recommendations: level === "high"
        ? ["Start with your smallest task", "Use the 2-minute rule now", "Try a 25-min focus room session"]
        : level === "medium"
          ? ["Begin with a 2-minute task", "Set an implementation intention"]
          : ["Keep going — you're building momentum"],
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get risk score");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/tasks/stats
router.get("/stats", async (req, res) => {
  try {
    const userId = req.userId!;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const tasks = await db.select().from(tasksTable)
      .where(and(eq(tasksTable.userId, userId), gte(tasksTable.createdAt, sevenDaysAgo)));

    const completed = tasks.filter(t => t.status === "completed");
    const missed = tasks.filter(t => t.status === "missed");

    const weeklyCompletionRate = tasks.length ? completed.length / tasks.length : 0;

    // Daily breakdown
    const byDate: Record<string, { completed: number; missed: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      byDate[d.toISOString().split("T")[0]] = { completed: 0, missed: 0 };
    }
    tasks.forEach(t => {
      const key = t.scheduledDate;
      if (byDate[key]) {
        if (t.status === "completed") byDate[key].completed++;
        if (t.status === "missed") byDate[key].missed++;
      }
    });

    const dailyBreakdown = Object.entries(byDate).map(([date, counts]) => ({
      date,
      completed: counts.completed,
      missed: counts.missed,
    }));

    // Streak
    let currentStreak = 0;
    const dates = Object.keys(byDate).sort().reverse();
    for (const date of dates) {
      if (byDate[date].completed > 0) currentStreak++;
      else break;
    }

    return res.json({
      weeklyCompletionRate,
      peakProcrastinationHour: null,
      totalCompleted: completed.length,
      totalMissed: missed.length,
      currentStreak,
      dailyBreakdown,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get task stats");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
