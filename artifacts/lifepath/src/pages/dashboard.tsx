import { useGetDashboardSummary, useGetSimulation, useGetLifeScore, useGetDailyInsight } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, Activity, Users, Flame, ChevronRight, Brain, Sparkles, TrendingUp, Zap, BookOpen, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";

const SCIENCE_FACTS = [
  {
    icon: "🧠",
    title: "The Compound Effect",
    text: "Improving just 1% each day compounds to 37× better in a year. James Clear (Atomic Habits, 2018) showed that identity-based habits — not outcome-based — create lasting change.",
    source: "Clear, J. (2018). Atomic Habits. Avery Publishing."
  },
  {
    icon: "⚡",
    title: "Why You Procrastinate",
    text: "Steel's Temporal Motivation Theory (2007) proves procrastination is rational: Motivation = (Expectancy × Value) / (Impulsiveness × Delay). LifePath hacks all four variables.",
    source: "Steel, P. (2007). Psychological Bulletin, 133(1), 65–94."
  },
  {
    icon: "🔄",
    title: "Dopamine Resets",
    text: "Every habit you break rewires your nucleus accumbens. Volkow et al. (2012) confirmed via fMRI that D2 receptor density begins recovering within 2 weeks of abstinence.",
    source: "Volkow, N.D. et al. (2012). Neuron, 69(4), 603–617."
  },
  {
    icon: "👥",
    title: "You Work Better With Others",
    text: "Zajonc (1965) discovered social facilitation: the mere presence of others improves performance on learned tasks by up to 37%. Body doubling works because of this.",
    source: "Zajonc, R.B. (1965). Science, 149(3681), 269–274."
  },
  {
    icon: "🎯",
    title: "Implementation Intentions",
    text: "Gollwitzer (1999) found that 'When X, then Y' planning increases follow-through by 91% compared to vague goals. LifePath's task system is built on this.",
    source: "Gollwitzer, P.M. (1999). American Psychologist, 54(7), 493–503."
  }
];

function AnimatedCounter({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, duration]);
  return <>{display}</>;
}

export default function Dashboard() {
  const { data, isLoading } = useGetDashboardSummary();
  const { data: simulation } = useGetSimulation();
  const { data: lifeScoreData } = useGetLifeScore();
  const [factIndex] = useState(() => new Date().getDay() % SCIENCE_FACTS.length);
  const fact = SCIENCE_FACTS[factIndex];

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-12 w-64 bg-card" />
        <Skeleton className="h-72 w-full rounded-3xl bg-card" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-28 w-full rounded-2xl bg-card" />
          <Skeleton className="h-28 w-full rounded-2xl bg-card" />
          <Skeleton className="h-28 w-full rounded-2xl bg-card" />
        </div>
      </div>
    );
  }

  const { user, lifeScore, todayTasks, activeStreak, dailyInsight, procrastinationRisk } = data;
  const score = lifeScore?.score ?? 0;
  const breakdown = lifeScoreData?.breakdown ?? lifeScore?.breakdown ?? {
    habitCompletion: 0, streakBonus: 0, focusSessions: 0, urgeResistance: 0, moodConsistency: 0
  };

  const getScoreColor = (s: number) => {
    if (s < 30) return "#FF4D6D";
    if (s <= 60) return "#F8A72A";
    if (s <= 80) return "#2B6BFF";
    return "#00E5A0";
  };

  const getScoreLabel = (s: number) => {
    if (s < 30) return "Critical — your patterns are costing you.";
    if (s <= 60) return "Building — momentum is forming.";
    if (s <= 80) return "Strong — habits are compounding.";
    return "Elite — you are in the top tier.";
  };

  const scoreColor = getScoreColor(score);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference * (1 - score / 100);

  const maxDay = simulation ? Math.max(...simulation.currentPath.map(p => p.day), ...simulation.goalPath.map(p => p.day)) : 30;
  const maxVal = 100;
  const W = 300;
  const H = 80;

  const toSVG = (points: { day: number; value: number }[]) =>
    points.map((p, i) => {
      const x = (p.day / maxDay) * W;
      const y = H - (p.value / maxVal) * H;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");

  const breakdownItems = [
    { label: "Habit Completion", value: breakdown.habitCompletion, color: "#2B6BFF", max: 40 },
    { label: "Streak Bonus", value: breakdown.streakBonus, color: "#00C8FF", max: 20 },
    { label: "Focus Sessions", value: breakdown.focusSessions, color: "#00E5A0", max: 20 },
    { label: "Urge Resistance", value: breakdown.urgeResistance, color: "#A78BFA", max: 10 },
    { label: "Mood Consistency", value: breakdown.moodConsistency, color: "#F8A72A", max: 10 },
  ];

  const completedToday = todayTasks?.filter(t => t.status === "completed").length ?? 0;
  const totalToday = todayTasks?.length ?? 0;

  return (
    <div className="p-5 md:p-8 space-y-8 max-w-4xl mx-auto pb-28">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1 pt-2">
        <h1 className="text-3xl font-display font-bold tracking-tight">
          {user?.name ? `Hey, ${user.name}` : "Your Dashboard"}
        </h1>
        <p className="text-muted-foreground">{getScoreLabel(score)}</p>
      </motion.div>

      {/* Life Score Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative p-8 rounded-3xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(228 44% 13%) 0%, hsl(228 44% 16%) 100%)", border: "1px solid hsl(228 47% 18%)" }}
      >
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: scoreColor }} />
        </div>

        <div className="relative flex flex-col md:flex-row items-center gap-8">
          {/* Score Ring */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="relative w-44 h-44">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(228 47% 18%)" strokeWidth="6" />
                <motion.circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
                  style={{ filter: `drop-shadow(0 0 8px ${scoreColor}60)` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-5xl font-display font-bold" style={{ color: scoreColor }}>
                  <AnimatedCounter value={score} duration={2000} />
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1 font-medium">Life Score</div>
              </div>
            </div>
            {lifeScore?.delta !== undefined && (
              <div className={`mt-3 px-4 py-1.5 rounded-full text-sm font-semibold ${lifeScore.delta >= 0 ? "text-[#00E5A0]" : "text-[#FF4D6D]"}`}
                style={{ background: lifeScore.delta >= 0 ? "rgba(0,229,160,0.1)" : "rgba(255,77,109,0.1)" }}>
                {lifeScore.delta >= 0 ? "↑" : "↓"} {Math.abs(lifeScore.delta)} today
              </div>
            )}
          </div>

          {/* Breakdown */}
          <div className="flex-1 w-full space-y-3">
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Score Breakdown</div>
            {breakdownItems.map((item, i) => (
              <motion.div key={item.label}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="space-y-1"
              >
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold" style={{ color: item.color }}>{item.value}/{item.max}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: item.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.value / item.max) * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 + i * 0.08, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Simulation Engine */}
        {simulation && simulation.currentPath.length > 0 && (
          <div className="relative mt-8 pt-6 border-t border-border/50">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Simulation Engine</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-6 h-0.5 bg-primary inline-block rounded" /> Your Path</span>
                <span className="flex items-center gap-1.5"><span className="w-6 h-0.5 bg-[#00E5A0] inline-block rounded opacity-60 border-dashed" style={{ borderTop: "2px dashed #00E5A0", height: 0 }} /> Goal Path</span>
              </div>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }} preserveAspectRatio="none">
              <defs>
                <linearGradient id="pathGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#2B6BFF" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#00C8FF" stopOpacity="1" />
                </linearGradient>
              </defs>
              <path d={toSVG(simulation.goalPath)} fill="none" stroke="#00E5A0" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5" />
              <motion.path
                d={toSVG(simulation.currentPath)}
                fill="none"
                stroke="url(#pathGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 0.6, ease: "easeOut" }}
              />
            </svg>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Gap: {simulation.gap} points · {simulation.gap <= 5 ? "Paths converging — keep pushing" : "Complete more tasks to close the gap"}
            </p>
          </div>
        )}
      </motion.div>

      {/* Quick Action Pills */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: "/tasks", icon: CheckSquare, label: "Tasks", sub: `${completedToday}/${totalToday} done`, color: "#2B6BFF", bg: "rgba(43,107,255,0.1)" },
          { href: "/addiction", icon: Flame, label: "Recovery", sub: activeStreak ? `Day ${activeStreak.currentDays}` : "Start streak", color: "#F8A72A", bg: "rgba(248,167,42,0.1)" },
          { href: "/body-doubling", icon: Users, label: "Focus Room", sub: "Join a session", color: "#00C8FF", bg: "rgba(0,200,255,0.1)" },
        ].map((item, i) => (
          <Link key={item.href} href={item.href}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="flex flex-col items-center justify-center p-5 rounded-2xl cursor-pointer text-center"
              style={{ background: item.bg, border: `1px solid ${item.color}30` }}
            >
              <item.icon className="w-7 h-7 mb-2" style={{ color: item.color }} />
              <div className="font-semibold text-sm">{item.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{item.sub}</div>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Procrastination Risk */}
      {procrastinationRisk && procrastinationRisk.level !== "low" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-4 rounded-2xl flex gap-3 items-start"
          style={{
            background: procrastinationRisk.level === "high" ? "rgba(255,77,109,0.08)" : "rgba(248,167,42,0.08)",
            border: `1px solid ${procrastinationRisk.level === "high" ? "rgba(255,77,109,0.3)" : "rgba(248,167,42,0.3)"}`
          }}
        >
          <Zap className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: procrastinationRisk.level === "high" ? "#FF4D6D" : "#F8A72A" }} />
          <div>
            <div className="font-semibold text-sm">Procrastination Risk: <span className="capitalize">{procrastinationRisk.level}</span></div>
            <p className="text-xs text-muted-foreground mt-1">{procrastinationRisk.reason}</p>
          </div>
        </motion.div>
      )}

      {/* Daily Science Insight */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="p-6 rounded-2xl space-y-3"
        style={{ background: "linear-gradient(135deg, rgba(43,107,255,0.08) 0%, rgba(0,200,255,0.06) 100%)", border: "1px solid rgba(43,107,255,0.2)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Today's Science</span>
        </div>
        <div className="text-2xl mb-1">{fact.icon}</div>
        <h3 className="font-display font-bold text-lg">{fact.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{fact.text}</p>
        <p className="text-xs text-muted-foreground/60 font-mono pt-1">{fact.source}</p>
      </motion.div>

      {/* Module Status Cards */}
      <div className="space-y-3">
        <h2 className="text-lg font-display font-bold">Active Modules</h2>
        {[
          {
            href: "/tasks",
            title: "Procrastination Killer",
            desc: totalToday === 0 ? "Add your first task for today" : `${completedToday} of ${totalToday} tasks complete — ${Math.round((completedToday / Math.max(totalToday, 1)) * 100)}% done`,
            badge: procrastinationRisk?.level ?? "low",
            badgeColor: procrastinationRisk?.level === "high" ? "#FF4D6D" : procrastinationRisk?.level === "medium" ? "#F8A72A" : "#00E5A0",
            science: "Powered by Temporal Motivation Theory (Steel, 2007) + Implementation Intentions (Gollwitzer, 1999)"
          },
          {
            href: "/addiction",
            title: "Addiction & Habit Recovery",
            desc: activeStreak ? `Day ${activeStreak.currentDays} of your recovery — dopamine baseline restoring` : "Start your recovery streak today",
            badge: activeStreak ? `${activeStreak.currentDays}d` : "Start",
            badgeColor: "#00C8FF",
            science: "Powered by Dopamine Seesaw (Lembke, 2021) + Urge Surfing ACT (Hayes, 2004)"
          },
          {
            href: "/body-doubling",
            title: "Body Doubling",
            desc: "Join a virtual room to trigger social facilitation and enter flow",
            badge: "Ready",
            badgeColor: "#A78BFA",
            science: "Powered by Social Facilitation (Zajonc, 1965) + Flow Theory (Csikszentmihalyi, 1990)"
          }
        ].map((mod, i) => (
          <Link key={mod.href} href={mod.href}>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              whileHover={{ x: 4 }}
              className="p-5 rounded-2xl flex items-center justify-between cursor-pointer group"
              style={{ background: "hsl(228 44% 13%)", border: "1px solid hsl(228 47% 18%)" }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{mod.title}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ color: mod.badgeColor, background: `${mod.badgeColor}18` }}>
                    {mod.badge}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{mod.desc}</p>
                <p className="text-xs text-muted-foreground/50 mt-1 truncate">{mod.science}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-4" />
            </motion.div>
          </Link>
        ))}
      </div>

      {/* App Insight */}
      {dailyInsight && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="p-5 rounded-2xl space-y-1"
          style={{ background: "rgba(0,200,255,0.05)", border: "1px solid rgba(0,200,255,0.15)" }}
        >
          <div className="text-xs font-semibold text-[#00C8FF] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Daily Insight
          </div>
          <p className="text-sm leading-relaxed text-foreground/90 italic">"{dailyInsight.text}"</p>
        </motion.div>
      )}
    </div>
  );
}
