import { useGetWeeklyReport } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Brain, Flame, Target } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Report() {
  const { data: report, isLoading } = useGetWeeklyReport();

  if (isLoading || !report) {
    return <div className="p-6 space-y-4"><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8 pb-24">
      <div className="space-y-2 text-center pt-4">
        <h1 className="text-3xl font-display font-bold">Weekly Report</h1>
        <p className="text-muted-foreground">{new Date(report.weekStart).toLocaleDateString()} - {new Date(report.weekEnd).toLocaleDateString()}</p>
      </div>

      <div className="p-6 bg-card rounded-3xl border border-border space-y-6 overflow-hidden relative">
        <div className="relative z-10 flex justify-between items-end">
          <div>
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Life Score</div>
            <div className="text-5xl font-display font-bold flex items-center gap-3">
              {report.lifeScoreHistory?.[report.lifeScoreHistory.length - 1]?.score || 0}
              <span className={`text-xl font-medium px-3 py-1 rounded-full ${report.lifeScoreChange >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                {report.lifeScoreChange >= 0 ? '+' : ''}{report.lifeScoreChange}
              </span>
            </div>
          </div>
        </div>

        {report.lifeScoreHistory && report.lifeScoreHistory.length > 0 && (
          <div className="h-40 w-full -mx-6 -mb-6 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={report.lifeScoreHistory}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#scoreGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-card rounded-2xl border border-border text-center">
          <Target className="w-6 h-6 text-primary mx-auto mb-2" />
          <div className="text-2xl font-bold">{report.moduleStats.tasksCompleted}</div>
          <div className="text-xs text-muted-foreground mt-1">Tasks</div>
        </div>
        <div className="p-4 bg-card rounded-2xl border border-border text-center">
          <Brain className="w-6 h-6 text-secondary mx-auto mb-2" />
          <div className="text-2xl font-bold">{report.moduleStats.focusHours}h</div>
          <div className="text-xs text-muted-foreground mt-1">Focus</div>
        </div>
        <div className="p-4 bg-card rounded-2xl border border-border text-center">
          <Flame className="w-6 h-6 text-warning mx-auto mb-2" />
          <div className="text-2xl font-bold">{report.moduleStats.urgesResisted}</div>
          <div className="text-xs text-muted-foreground mt-1">Resisted</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-5 bg-card rounded-2xl border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-warning" />
            <h3 className="font-semibold text-lg">Biggest Win</h3>
          </div>
          <p className="text-foreground/90">{report.biggestWin}</p>
        </div>
        
        <div className="p-5 bg-secondary/5 rounded-2xl border border-secondary/20">
          <div className="text-secondary text-sm font-semibold mb-2 uppercase tracking-wide">The Science</div>
          <p className="text-foreground/90 font-medium">{report.scienceInsight}</p>
        </div>
      </div>
    </div>
  );
}
