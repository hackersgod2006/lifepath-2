import { Router } from "express";
import { db } from "@workspace/db";
import { roomsTable, focusSessionsTable } from "@workspace/db";
import { eq, and, gte, desc } from "drizzle-orm";
import { CreateRoomBody, JoinRoomBody } from "@workspace/api-zod";

const router = Router();

function toRoomResponse(r: typeof roomsTable.$inferSelect) {
  return {
    id: r.id,
    name: r.name,
    presenceCount: r.presenceCount,
    isPrivate: r.isPrivate,
    isActive: r.isActive,
    currentSessionMinutes: r.currentSessionMinutes,
    createdAt: r.createdAt.toISOString(),
  };
}

// GET /api/rooms
router.get("/", async (req, res) => {
  try {
    const rooms = await db.select().from(roomsTable)
      .where(eq(roomsTable.isActive, true))
      .orderBy(desc(roomsTable.presenceCount));

    return res.json(rooms.map(toRoomResponse));
  } catch (err) {
    req.log.error({ err }, "Failed to get rooms");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/rooms
router.post("/", async (req, res) => {
  try {
    const userId = req.userId!;

    const parsed = CreateRoomBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid room data" });

    const { name, isPrivate } = parsed.data;

    const [room] = await db.insert(roomsTable).values({
      name,
      createdBy: userId,
      presenceCount: 0,
      isPrivate: isPrivate ?? false,
      isActive: true,
    }).returning();

    return res.status(201).json(toRoomResponse(room));
  } catch (err) {
    req.log.error({ err }, "Failed to create room");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/rooms/:id/join
router.post("/:id/join", async (req, res) => {
  try {
    const userId = req.userId!;

    const roomId = parseInt(req.params.id);
    const parsed = JoinRoomBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid join data" });

    const { intention, durationMinutes } = parsed.data;

    // Increment room presence count
    const rooms = await db.select().from(roomsTable).where(eq(roomsTable.id, roomId)).limit(1);
    if (!rooms.length) return res.status(404).json({ error: "Room not found" });

    await db.update(roomsTable)
      .set({ presenceCount: rooms[0].presenceCount + 1, currentSessionMinutes: durationMinutes })
      .where(eq(roomsTable.id, roomId));

    // Create a focus session for this user in this room
    const [session] = await db.insert(focusSessionsTable).values({
      userId,
      roomId,
      intention,
      durationMinutes,
      status: "active",
    }).returning();

    return res.json({
      roomId,
      sessionId: session.id,
      joinedAt: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to join room");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/rooms/:id/leave
router.post("/:id/leave", async (req, res) => {
  try {
    const roomId = parseInt(req.params.id);

    const rooms = await db.select().from(roomsTable).where(eq(roomsTable.id, roomId)).limit(1);
    if (!rooms.length) return res.status(404).json({ error: "Room not found" });

    const newCount = Math.max(0, rooms[0].presenceCount - 1);
    await db.update(roomsTable)
      .set({ presenceCount: newCount })
      .where(eq(roomsTable.id, roomId));

    return res.json({ message: "Left room" });
  } catch (err) {
    req.log.error({ err }, "Failed to leave room");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/rooms/stats
router.get("/stats", async (req, res) => {
  try {
    const userId = req.userId!;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const sessions = await db.select().from(focusSessionsTable)
      .where(and(
        eq(focusSessionsTable.userId, userId),
        gte(focusSessionsTable.createdAt, weekAgo),
      ));

    const roomSessions = sessions.filter(s => s.roomId !== null);
    const completed = roomSessions.filter(s => s.status === "completed");
    const totalHours = completed.reduce((acc, s) => acc + s.durationMinutes, 0) / 60;

    return res.json({
      totalSessions: completed.length,
      totalHours: Math.round(totalHours * 10) / 10,
      currentStreak: completed.length,
      mostProductiveHour: null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get room stats");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
