import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, hashPassword, comparePassword } from "../lib/auth.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(usersTable).values({
      name,
      email,
      passwordHash,
      activeModules: [],
      onboardingComplete: false,
    }).returning();

    const token = signToken({ userId: user.id, email: user.email! });
    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        biggestStruggle: user.biggestStruggle,
        addictionType: user.addictionType,
        activeModules: user.activeModules ?? [],
        onboardingComplete: user.onboardingComplete,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Register failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken({ userId: user.id, email: user.email! });
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        biggestStruggle: user.biggestStruggle,
        addictionType: user.addictionType,
        activeModules: user.activeModules ?? [],
        onboardingComplete: user.onboardingComplete,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Login failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      biggestStruggle: user.biggestStruggle,
      addictionType: user.addictionType,
      activeModules: user.activeModules ?? [],
      onboardingComplete: user.onboardingComplete,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Get auth/me failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/logout — stateless, client drops token
router.post("/logout", (_req, res) => {
  return res.json({ message: "Logged out" });
});

export default router;
