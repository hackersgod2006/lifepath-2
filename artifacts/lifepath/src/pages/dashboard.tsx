import { useGetDashboardSummary, useGetSimulation, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { CheckSquare, Activity, Users, Flame, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data, isLoading } = useGetDashboardSummary();
  const { data: simulation } = useGetSimulation();

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const { user, lifeScore, todayTasks, activeStreak, dailyInsight } = data;
  
  const getScoreColor = (score: number) => {
    if (score < 30) return "hsl(var(--destructive))";
    if (score <= 60) return "hsl(var(--warning))";
    if (score <= 85) return "hsl(var(--primary))";
    return "hsl(var(--success))";
  };

  const scoreColor = getScoreColor(lifeScore.score);
  const scorePercent = lifeScore.score / 100;

  // Generate SVG path for simulation
  const maxDay = simulation ? Math.max(...simulation.currentPath.map(p => p.day), ...simulation.goalPath.map(p => p.day)) : 30;
  const maxValue = simulation ? Math.max(
    ...simulation.currentPath.map(p => p.value), 
    ...simulation.goalPath.map(p => p.value)
  ) : 100;
  
  const createPath = (points: {day: number, value: number}[]) => {
    if (!points || points.length === 0) return "";
    return points.map((p, i) => {
      const x = (p.day / maxDay) * 100;
      const y = 20 - ((p.value / maxValue) * 20); // invert Y
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(" ");
  };

  return (
    <div className="p-6 md:p-10 space-y-10 max-w-4xl mx-auto pb-24">
      <div className="space-y-1">
        <h1 className="text-3xl font-display font-bold">Good morning, {user.name}</h1>
        <p className="text-muted-foreground text-lg">Your trajectory is shifting upward.</p>
      </div>

      <div className="flex flex-col items-center justify-center p-8 bg-card rounded-3xl border border-border relative overflow-hidden">
        <div className="relative w-48 h-48 flex items-center justify-center mb-6">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <motion.circle 
              cx="50" cy="50" r="45" 
              fill="none" 
              stroke={scoreColor} 
              strokeWidth="6"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: scorePercent }}
              transition={{ type: "spring", duration: 2, bounce: 0 }}
              className="origin-center -rotate-90 drop-shadow-md"
            />
          </svg>
          <div className="flex flex-col items-center">
            <span className="text-5xl font-display font-bold">{Math.round(lifeScore.score)}</span>
            <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Life Score</span>
          </div>
        </div>
        
        <div className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1 ${lifeScore.delta >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
          {lifeScore.delta >= 0 ? "+" : ""}{lifeScore.delta} today
        </div>

        {simulation && (
          <div className="mt-8 w-full px-4">
            <div className="text-xs text-muted-foreground mb-2 flex justify-between">
              <span>Simulation Engine</span>
              <span>Converging in {simulation.gap > 0 ? "soon" : "now"}</span>
            </div>
            <div className="h-12 w-full relative">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 20">
                 <path d={createPath(simulation.goalPath)} fill="none" stroke="hsl(var(--success))" strokeWidth="1" strokeDasharray="2 2" className="opacity-50" />
                 <motion.path 
                   d={createPath(simulation.currentPath)} 
                   fill="none" 
                   stroke="hsl(var(--primary))" 
                   strokeWidth="2"
                   initial={{ pathLength: 0 }}
                   animate={{ pathLength: 1 }}
                   transition={{ duration: 1.5, delay: 0.5 }}
                 />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Link href="/tasks" className="flex flex-col items-center justify-center p-4 bg-card rounded-2xl border border-border hover:border-primary/50 hover:-translate-y-1 transition-all">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary">
            <CheckSquare className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium text-center">Tasks</span>
        </Link>
        <Link href="/body-doubling" className="flex flex-col items-center justify-center p-4 bg-card rounded-2xl border border-border hover:border-primary/50 hover:-translate-y-1 transition-all">
          <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-3 text-secondary">
            <Users className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium text-center">Join Room</span>
        </Link>
        <Link href="/addiction" className="flex flex-col items-center justify-center p-4 bg-card rounded-2xl border border-border hover:border-primary/50 hover:-translate-y-1 transition-all">
          <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mb-3 text-warning">
            <Flame className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium text-center">Log Urge</span>
        </Link>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-display font-semibold">Active Modules</h2>
        
        <Link href="/tasks" className="block group">
          <div className="p-5 bg-card rounded-2xl border border-border flex items-center justify-between group-hover:border-primary/50 transition-colors">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Procrastination Killer
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {todayTasks.filter(t => t.status === 'completed').length} of {todayTasks.length} tasks completed
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </Link>

        {activeStreak && (
          <Link href="/addiction" className="block group">
            <div className="p-5 bg-card rounded-2xl border border-border flex items-center justify-between group-hover:border-primary/50 transition-colors">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  Addiction Recovery
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Day {activeStreak.currentDays} • Dopamine resetting
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        )}
      </div>

      {dailyInsight && (
        <div className="p-5 rounded-2xl bg-secondary/5 border border-secondary/20">
          <div className="text-secondary text-sm font-semibold mb-2 uppercase tracking-wide">Daily Insight</div>
          <p className="text-foreground/90 text-lg leading-relaxed font-medium">"{dailyInsight.text}"</p>
        </div>
      )}
      
    </div>
  );
}
