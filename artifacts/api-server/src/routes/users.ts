import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, streaksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CompleteOnboardingBody } from "@workspace/api-zod";

const router = Router();

// GET /api/users/me
router.get("/me", async (req, res) => {
  try {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!u) return res.status(404).json({ error: "User not found" });
    return res.json({
      id: u.id,
      name: u.name,
      email: (u as any).email ?? null,
      biggestStruggle: u.biggestStruggle,
      struggleDuration: u.struggleDuration,
      triedBefore: u.triedBefore,
      changeStatement: u.changeStatement,
      addictionType: u.addictionType,
      activeModules: u.activeModules ?? [],
      onboardingComplete: u.onboardingComplete,
      createdAt: u.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get user");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/users/me
router.patch("/me", async (req, res) => {
  try {
    const userId = req.userId!;
    const { name, activeModules, addictionType, biggestStruggle, changeStatement } = req.body;
    const [updated] = await db
      .update(usersTable)
      .set({
        ...(name !== undefined && { name }),
        ...(activeModules !== undefined && { activeModules }),
        ...(addictionType !== undefined && { addictionType }),
        ...(biggestStruggle !== undefined && { biggestStruggle }),
        ...(changeStatement !== undefined && { changeStatement }),
      })
      .where(eq(usersTable.id, userId))
      .returning();
    return res.json({
      id: updated.id,
      name: updated.name,
      email: (updated as any).email ?? null,
      biggestStruggle: updated.biggestStruggle,
      struggleDuration: updated.struggleDuration,
      triedBefore: updated.triedBefore,
      changeStatement: updated.changeStatement,
      addictionType: updated.addictionType,
      activeModules: updated.activeModules ?? [],
      onboardingComplete: updated.onboardingComplete,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update user");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/users/onboard
router.post("/onboard", async (req, res) => {
  try {
    const parsed = CompleteOnboardingBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid onboarding data" });
    }
    const { name, biggestStruggle, struggleDuration, triedBefore, changeStatement, addictionType } = parsed.data;

    // Calculate initial life score (20–55 range)
    let initialLifeScore = 30;
    if (struggleDuration === "weeks") initialLifeScore += 5;
    if (triedBefore === "no_first_time") initialLifeScore += 5;
    if (biggestStruggle === "procrastination") initialLifeScore += 3;

    // Determine active modules
    const activeModules = ["procrastination", "body_doubling"];
    if (addictionType) activeModules.push("addiction");

    const userId = req.userId!;
    const [user] = await db
      .update(usersTable)
      .set({
        name,
        biggestStruggle: biggestStruggle ?? null,
        struggleDuration: struggleDuration ?? null,
        triedBefore: triedBefore ?? null,
        changeStatement: changeStatement ?? null,
        addictionType: addictionType ?? null,
        activeModules,
        onboardingComplete: true,
      })
      .where(eq(usersTable.id, userId))
      .returning();

    if (addictionType) {
      const existingStreaks = await db.select().from(streaksTable).where(eq(streaksTable.userId, user.id));
      if (!existingStreaks.length) {
        await db.insert(streaksTable).values({
          userId: user.id,
          addictionType,
          currentDays: 0,
          longestDays: 0,
          startedAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: (user as any).email ?? null,
        biggestStruggle: user.biggestStruggle,
        struggleDuration: user.struggleDuration,
        triedBefore: user.triedBefore,
        changeStatement: user.changeStatement,
        addictionType: user.addictionType,
        activeModules: user.activeModules ?? [],
        onboardingComplete: user.onboardingComplete,
        createdAt: user.createdAt.toISOString(),
      },
      initialLifeScore,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to onboard user");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
