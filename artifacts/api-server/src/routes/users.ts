import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, streaksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CompleteOnboardingBody } from "@workspace/api-zod";

const router = Router();

// GET /api/users/me — returns first user (demo single-user)
router.get("/me", async (req, res) => {
  try {
    const users = await db.select().from(usersTable).limit(1);
    if (!users.length) {
      return res.status(404).json({ error: "No user found" });
    }
    const u = users[0];
    return res.json({
      id: u.id,
      name: u.name,
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
    const users = await db.select().from(usersTable).limit(1);
    if (!users.length) return res.status(404).json({ error: "No user" });
    const userId = users[0].id;
    const { name, activeModules, addictionType } = req.body;
    const [updated] = await db
      .update(usersTable)
      .set({
        ...(name && { name }),
        ...(activeModules && { activeModules }),
        ...(addictionType !== undefined && { addictionType }),
      })
      .where(eq(usersTable.id, userId))
      .returning();
    return res.json({
      id: updated.id,
      name: updated.name,
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

    // Check if user exists
    const existing = await db.select().from(usersTable).limit(1);
    let user;
    if (existing.length) {
      const [updated] = await db
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
        .where(eq(usersTable.id, existing[0].id))
        .returning();
      user = updated;
    } else {
      const [created] = await db
        .insert(usersTable)
        .values({
          name,
          biggestStruggle: biggestStruggle ?? null,
          struggleDuration: struggleDuration ?? null,
          triedBefore: triedBefore ?? null,
          changeStatement: changeStatement ?? null,
          addictionType: addictionType ?? null,
          activeModules,
          onboardingComplete: true,
        })
        .returning();
      user = created;
    }

    // Create initial streak if addiction type provided
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
