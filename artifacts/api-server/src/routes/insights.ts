import { Router } from "express";
import { db } from "@workspace/db";
import { insightsTable } from "@workspace/db";

const router = Router();

const SCIENCE_INSIGHTS = [
  { text: "Research from Stanford shows the smallest possible version of a task is always the right place to start. One word. One sentence. One breath.", source: "BJ Fogg, Stanford Behavior Design Lab", module: "procrastination" },
  { text: "Piers Steel's mathematical formula of procrastination: Motivation = (Expectancy × Value) / (Impulsiveness × Delay). Every completed task shifts this equation in your favour.", source: "Temporal Motivation Theory, Psychological Bulletin, 2007", module: "procrastination" },
  { text: "Peter Gollwitzer found that people who form 'When X happens, I will do Y' plans are 2-3x more likely to follow through. Your implementation intention is not optional — it's science.", source: "American Psychologist, 1999", module: "procrastination" },
  { text: "Fuschia Sirois found that self-criticism after procrastinating predicts more procrastination, not less. Self-compassion predicts recovery. How you talk to yourself matters.", source: "Self and Identity, 2014", module: "procrastination" },
  { text: "Pleasure and pain are processed in the same brain region and balance like a seesaw. Every day of recovery tips the balance back toward you.", source: "Anna Lembke, Dopamine Nation, Stanford Psychiatry", module: "addiction" },
  { text: "The brain's wanting system fires separately from the liking system. This is why you pursue things that no longer bring genuine pleasure. Noticing the difference is the first act of recovery.", source: "Nora Volkow, NIH Director of NIDA", module: "addiction" },
  { text: "Most relapses are triggered by Hunger, Anger, Loneliness, or Tiredness. Knowing which one is active right now gives you a 60-second window to choose differently.", source: "HALT Method, Clinical Standard in Addiction Medicine", module: "addiction" },
  { text: "An urge rises, peaks, and falls like a wave — without action. Urge surfing research shows that simply observing an urge, without fighting it, reduces its power.", source: "Steven Hayes, Acceptance and Commitment Therapy", module: "addiction" },
  { text: "The deepest driver of compulsive behaviour is disconnection — from meaningful work, from relationships, from purpose. Recovery is reconnection, not just cessation.", source: "Johann Hari, Lost Connections, 2018", module: "addiction" },
  { text: "The presence of another person working — even silently, even virtually — activates your brain's accountability systems and dramatically increases your ability to begin.", source: "Ned Hallowell, Harvard Medical School", module: "body_doubling" },
  { text: "Flow states require four conditions: clear goals, immediate feedback, a challenge matched to skill, and freedom from distraction. Your next session engineers all four simultaneously.", source: "Mihaly Csikszentmihalyi, Flow, University of Chicago", module: "body_doubling" },
  { text: "Robert Zajonc's 1965 finding in Science — one of the most cited in social psychology: the presence of others enhances performance. This effect has been replicated for 60 years.", source: "Social Facilitation Theory, Science, 1965", module: "body_doubling" },
  { text: "Pairing an activity you enjoy with a task you avoid dramatically increases follow-through. Temptation bundling is not a trick — it's behavioural economics applied to your life.", source: "Katherine Milkman, Wharton School", module: "procrastination" },
  { text: "At Day 14 of recovery, prefrontal cortex activity is measurably higher than Day 1. That is not motivation. That is neuroscience. You are building a different brain.", source: "Neurological Recovery Research, fMRI Studies", module: "addiction" },
  { text: "At Day 30, dopamine baseline approaches pre-addiction levels. What felt impossible on Day 1 is becoming your new normal.", source: "Dopamine Neuroscience, Published Clinical Research", module: "addiction" },
  { text: "Any task completable in under 2 minutes should be done immediately. The cost of deferring it exceeds the cost of completing it right now.", source: "David Allen, Getting Things Done, 2001", module: "procrastination" },
  { text: "Structured work intervals of 25 minutes with defined breaks prevent cognitive fatigue better than open-ended sessions. Your brain needs rhythm, not just willpower.", source: "Pomodoro Technique Research, Productivity Science", module: "body_doubling" },
  { text: "Antonio Damasio showed that humans make decisions based on emotional states, not logic alone. The app checks how you feel each morning because it changes everything that follows.", source: "Somatic Marker Hypothesis, Descartes' Error, 1994", module: "general" },
];

// GET /api/insights/daily
router.get("/daily", async (req, res) => {
  try {
    // Return a deterministic daily insight based on day of year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const insight = SCIENCE_INSIGHTS[dayOfYear % SCIENCE_INSIGHTS.length];

    return res.json({
      id: dayOfYear,
      text: insight.text,
      source: insight.source,
      module: insight.module,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get daily insight");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
