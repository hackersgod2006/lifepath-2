import { useGetWeeklyReport, useGetLifeScoreHistory, useGetTaskStats, useGetSessionStats } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Trophy, Brain, Flame, Target, TrendingUp, BookOpen, Star, Award, Calendar } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

const SCIENCE_PRINCIPLES = [
  { label: "Habit Formation", insight: "Lally et al. (2010): The average time for a behavior to become automatic is 66 days, not 21. LifePath tracks your true curve.", color: "#2B6BFF" },
  { label: "Consistency > Intensity", insight: "Clear (2018): You don't rise to the level of your goals, you fall to the level of your systems. Weekly consistency is more predictive of success than any single great day.", color: "#00C8FF" },
  { label: "Identity-Based Change", insight: "Every action you take is a vote for the type of person you want to become. Your weekly data is evidence of who you're becoming.", color: "#00E5A0" },
];

export default function Report() {
  const { data: report, isLoading: reportLoading } = useGetWeeklyReport();
  const { data: history } = useGetLifeScoreHistory();
  const { data: taskStats } = useGetTaskStats();
  const { data: sessionStats } = useGetSessionStats();

  if (reportLoading) {
    return (
      <div className="p-6 space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-10 w-64 bg-card mx-auto" />
        <Skeleton className="h-64 w-full rounded-3xl bg-card" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-24 rounded-2xl bg-card" />
          <Skeleton className="h-24 rounded-2xl bg-card" />
          <Skeleton className="h-24 rounded-2xl bg-card" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center py-20">
        <div className="text-5xl mb-4">📊</div>
        <h2 className="text-2xl font-display font-bold mb-3">No report yet</h2>
        <p className="text-muted-foreground max-w-sm mx-auto">Complete tasks, log urges, and join focus sessions for 3+ days. Your weekly report will appear here with personalized science insights.</p>
      </div>
    );
  }

  const latestScore = report.lifeScoreHistory?.[report.lifeScoreHistory.length - 1]?.score ?? 0;
  const startScore = report.lifeScoreHistory?.[0]?.score ?? latestScore;
  const weekChange = latestScore - startScore;
  const isPositive = weekChange >= 0;

  const formattedHistory = report.lifeScoreHistory?.map((h: any, i: number) => ({
    day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i] ?? `Day ${i + 1}`,
    score: h.score
  })) ?? [];

  const radarData = [
    { subject: "Habits", A: Math.min(100, (report.moduleStats?.tasksCompleted ?? 0) * 8) },
    { subject: "Focus", A: Math.min(100, (report.moduleStats?.focusHours ?? 0) * 12) },
    { subject: "Recovery", A: Math.min(100, (report.moduleStats?.urgesResisted ?? 0) * 15) },
    { subject: "Mood", A: 60 },
    { subject: "Streak", A: 50 },
  ];

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { label: "Elite", color: "#00E5A0" };
    if (score >= 70) return { label: "Strong", color: "#2B6BFF" };
    if (score >= 50) return { label: "Building", color: "#F8A72A" };
    return { label: "Starting", color: "#FF4D6D" };
  };
  const grade = getScoreGrade(latestScore);

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto space-y-8 pb-28">
      {/* Header */}
      <div className="text-center pt-2 space-y-1">
        <h1 className="text-3xl font-display font-bold">Weekly Life Report</h1>
        <p className="text-muted-foreground text-sm">
          <Calendar className="w-3.5 h-3.5 inline mr-1" />
          {new Date(report.weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} —
          {new Date(report.weekEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Score Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 rounded-3xl relative overflow-hidden"
        style={{ background: "hsl(228 44% 13%)", border: "1px solid hsl(228 47% 18%)" }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% -20%, ${grade.color}12, transparent 70%)` }} />
        <div className="relative flex flex-col md:flex-row items-start gap-6">
          <div className="space-y-3">
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Life Score</div>
            <div className="flex items-end gap-4">
              <div className="text-7xl font-display font-bold" style={{ color: grade.color }}>{latestScore}</div>
              <div className="flex flex-col gap-1 pb-2">
                <span className="text-sm px-3 py-1 rounded-full font-semibold" style={{ color: grade.color, background: `${grade.color}18` }}>
                  {grade.label}
                </span>
                <span className={`text-lg font-semibold ${isPositive ? "text-[#00E5A0]" : "text-[#FF4D6D]"}`}>
                  {isPositive ? "+" : ""}{weekChange} this week
                </span>
              </div>
            </div>
          </div>

          {formattedHistory.length > 0 && (
            <div className="flex-1 w-full h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedHistory} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={grade.color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={grade.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: "hsl(220 20% 58%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip
                    contentStyle={{ background: "hsl(228 44% 15%)", border: "1px solid hsl(228 47% 22%)", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "hsl(220 47% 95%)" }}
                  />
                  <Area type="monotone" dataKey="score" stroke={grade.color} strokeWidth={2.5} fill="url(#scoreGrad)" dot={{ fill: grade.color, r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </motion.div>

      {/* Module Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Target, label: "Tasks Done", value: report.moduleStats?.tasksCompleted ?? 0, suffix: "", color: "#2B6BFF", science: "Each task = dopamine release + self-efficacy build" },
          { icon: Brain, label: "Focus Hours", value: report.moduleStats?.focusHours ?? 0, suffix: "h", color: "#00C8FF", science: "Deep work = irreplaceable skill building" },
          { icon: Flame, label: "Urges Resisted", value: report.moduleStats?.urgesResisted ?? 0, suffix: "", color: "#00E5A0", science: "Each resist weakens the craving pathway" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-2xl text-center space-y-2"
            style={{ background: "hsl(228 44% 13%)", border: `1px solid ${stat.color}20` }}
          >
            <stat.icon className="w-5 h-5 mx-auto mb-1" style={{ color: stat.color }} />
            <div className="text-3xl font-display font-bold" style={{ color: stat.color }}>{stat.value}{stat.suffix}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
            <div className="text-xs text-muted-foreground/50 leading-snug">{stat.science}</div>
          </motion.div>
        ))}
      </div>

      {/* Radar Chart */}
      {radarData.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl"
          style={{ background: "hsl(228 44% 13%)", border: "1px solid hsl(228 47% 18%)" }}
        >
          <h3 className="font-display font-bold text-lg mb-4">Balance Profile</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(228 47% 22%)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(220 20% 58%)", fontSize: 11 }} />
                <Radar name="This Week" dataKey="A" stroke="#2B6BFF" fill="#2B6BFF" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Biggest Win */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="p-6 rounded-2xl space-y-3"
        style={{ background: "rgba(248,167,42,0.07)", border: "1px solid rgba(248,167,42,0.25)" }}
      >
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#F8A72A]" />
          <h3 className="font-bold text-lg">Biggest Win This Week</h3>
        </div>
        <p className="text-foreground/90 text-base leading-relaxed">{report.biggestWin}</p>
      </motion.div>

      {/* Milestones / Achievements */}
      {((taskStats?.currentStreak ?? 0) > 0 || (report.moduleStats?.urgesResisted ?? 0) >= 5) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="space-y-3">
          <h3 className="font-display font-bold flex items-center gap-2"><Award className="w-5 h-5 text-[#A78BFA]" /> Milestones</h3>
          <div className="grid grid-cols-2 gap-3">
            {(taskStats?.currentStreak ?? 0) >= 3 && (
              <div className="p-4 rounded-xl" style={{ background: "rgba(43,107,255,0.08)", border: "1px solid rgba(43,107,255,0.2)" }}>
                <div className="text-2xl mb-1">🔥</div>
                <div className="font-semibold text-sm">{taskStats!.currentStreak}-Day Task Streak</div>
                <div className="text-xs text-muted-foreground mt-1">Consistency compounds exponentially</div>
              </div>
            )}
            {report.moduleStats?.urgesResisted >= 5 && (
              <div className="p-4 rounded-xl" style={{ background: "rgba(0,229,160,0.07)", border: "1px solid rgba(0,229,160,0.2)" }}>
                <div className="text-2xl mb-1">🛡️</div>
                <div className="font-semibold text-sm">{report.moduleStats.urgesResisted} Urges Resisted</div>
                <div className="text-xs text-muted-foreground mt-1">Neural pathways are weakening</div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Science Insight */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="p-6 rounded-2xl space-y-3"
        style={{ background: "rgba(43,107,255,0.06)", border: "1px solid rgba(43,107,255,0.2)" }}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Weekly Science</span>
        </div>
        <p className="text-foreground/90 leading-relaxed font-medium">{report.scienceInsight}</p>
      </motion.div>

      {/* Principles Section */}
      <div className="space-y-3">
        <h3 className="font-display font-bold flex items-center gap-2"><Star className="w-4 h-4 text-[#F8A72A]" /> Evidence-Based Principles</h3>
        <div className="space-y-3">
          {SCIENCE_PRINCIPLES.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.08 }}
              className="p-4 rounded-xl"
              style={{ background: `${p.color}06`, border: `1px solid ${p.color}20` }}
            >
              <div className="font-semibold text-sm mb-1" style={{ color: p.color }}>{p.label}</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{p.insight}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Next Week Prompt */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="p-6 rounded-2xl text-center"
        style={{ background: "linear-gradient(135deg, rgba(43,107,255,0.08), rgba(0,200,255,0.06))", border: "1px solid rgba(43,107,255,0.2)" }}
      >
        <div className="text-2xl mb-3">🎯</div>
        <h3 className="font-display font-bold text-lg mb-2">The Compound Effect</h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
          Darren Hardy (2010): Small, seemingly insignificant steps completed consistently over time will create a radical difference. Your next week doesn't have to be perfect — it has to be consistent.
        </p>
      </motion.div>
    </div>
  );
}
