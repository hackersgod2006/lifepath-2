import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import usersRouter from "./users.js";
import lifeScoreRouter from "./life-score.js";
import tasksRouter from "./tasks.js";
import moodRouter from "./mood.js";
import sessionsRouter from "./sessions.js";
import urgesRouter from "./urges.js";
import roomsRouter from "./rooms.js";
import insightsRouter from "./insights.js";
import dashboardRouter from "./dashboard.js";
import weeklyReportRouter from "./weekly-report.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/users", usersRouter);
router.use("/life-score", lifeScoreRouter);
router.use("/tasks", tasksRouter);
router.use("/mood", moodRouter);
router.use("/sessions", sessionsRouter);
router.use("/urges", urgesRouter);
router.use("/streaks", urgesRouter);
router.use("/rooms", roomsRouter);
router.use("/insights", insightsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/weekly-report", weeklyReportRouter);

export default router;
