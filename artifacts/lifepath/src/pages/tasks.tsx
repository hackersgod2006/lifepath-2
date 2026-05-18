import { useState } from "react";
import {
  useGetTasks, useCreateTask, useUpdateTask, useDeleteTask,
  useGetProcrastinationRisk, useGetTaskStats,
  getGetTasksQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Plus, CheckCircle2, Circle, AlertCircle, Brain,
  Trash2, Clock, Target, BookOpen, X, ChevronDown, ChevronUp,
  Lightbulb, Shield, TrendingUp, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const SCIENCE_CARDS = [
  {
    icon: "⚡",
    title: "The 2-Minute Rule",
    body: "If a task takes less than 2 minutes, do it immediately. David Allen (Getting Things Done, 2001) found that deferring small tasks creates invisible psychological debt that compounds into procrastination.",
    color: "#2B6BFF"
  },
  {
    icon: "🎯",
    title: "Implementation Intentions",
    body: "Peter Gollwitzer (1999) ran 94 studies proving that specifying 'When [X happens], I will [do Y]' increases follow-through by 91%. This is why LifePath asks you to set a When-Then plan.",
    color: "#00C8FF"
  },
  {
    icon: "🍫",
    title: "Temptation Bundling",
    body: "Katherine Milkman (Wharton, 2014) discovered pairing a pleasure (podcast, snack, music) with a dreaded task makes you 51% more likely to complete it. It's not bribery — it's science.",
    color: "#A78BFA"
  },
  {
    icon: "❤️",
    title: "Self-Compassion After Procrastination",
    body: "Sirois & Pychyl (2013) found that self-forgiveness — not self-criticism — after a missed task significantly reduces future procrastination. Guilt fuels avoidance. Compassion fuels action.",
    color: "#00E5A0"
  },
  {
    icon: "📐",
    title: "Temporal Motivation Theory",
    body: "Steel (2007): Motivation = (Expectancy × Value) / (Impulsiveness × Delay). You procrastinate when reward feels distant or uncertain. Breaking tasks into smaller steps hacks the Delay variable.",
    color: "#F8A72A"
  }
];

const TMT_FORMULA = "Motivation = (Expectancy × Value) ÷ (Impulsiveness × Delay)";

export default function Tasks() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: tasks, isLoading: tasksLoading } = useGetTasks();
  const { data: risk } = useGetProcrastinationRisk();
  const { data: taskStats } = useGetTaskStats();

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [implementationIntention, setImplementationIntention] = useState("");
  const [temptationBundle, setTemptationBundle] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [expandedScience, setExpandedScience] = useState<number | null>(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleCreate = () => {
    if (!newTaskTitle.trim()) return;
    createTask.mutate(
      {
        data: {
          title: newTaskTitle,
          implementationIntention: implementationIntention || undefined,
          temptationBundle: temptationBundle || undefined,
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
          setNewTaskTitle("");
          setImplementationIntention("");
          setTemptationBundle("");
          setIsSheetOpen(false);
          toast({ title: "Task added", description: "Implementation intention locked in." });
        }
      }
    );
  };

  const handleToggle = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    updateTask.mutate(
      { id, data: { status: newStatus as "pending" | "completed" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
          if (newStatus === "completed") {
            toast({ title: "✓ Task complete", description: "Your Life Score just went up." });
          }
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    deleteTask.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
          setDeletingId(null);
        },
        onError: () => setDeletingId(null)
      }
    );
  };

  if (tasksLoading) {
    return (
      <div className="p-6 space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-10 w-64 bg-card" />
        <Skeleton className="h-24 w-full rounded-2xl bg-card" />
        <Skeleton className="h-40 w-full rounded-2xl bg-card" />
      </div>
    );
  }

  const pendingTasks = tasks?.filter(t => t.status === "pending" || t.status === "snoozed") ?? [];
  const completedTasks = tasks?.filter(t => t.status === "completed") ?? [];
  const twoMinuteTasks = pendingTasks.filter(t => t.isTwoMinute);
  const normalTasks = pendingTasks.filter(t => !t.isTwoMinute);
  const completionPct = tasks?.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const riskColors = { low: "#00E5A0", medium: "#F8A72A", high: "#FF4D6D" };
  const riskColor = riskColors[risk?.level ?? "low"];

  return (
    <div className="p-5 md:p-8 max-w-2xl mx-auto space-y-8 pb-28">
      {/* Header */}
      <div className="flex justify-between items-start pt-2">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Procrastination Killer</h1>
          <p className="text-muted-foreground text-sm mt-1">Built on Temporal Motivation Theory · BJ Fogg · Gollwitzer</p>
        </div>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: "#2B6BFF" }}
            >
              <Plus className="w-6 h-6 text-white" />
            </motion.button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl overflow-y-auto" style={{ background: "hsl(228 44% 10%)", border: "none" }}>
            <SheetHeader className="pb-2">
              <SheetTitle className="font-display text-xl">Add a Task</SheetTitle>
            </SheetHeader>

            {/* TMT Formula */}
            <div className="my-4 p-4 rounded-xl text-center" style={{ background: "rgba(43,107,255,0.1)", border: "1px solid rgba(43,107,255,0.2)" }}>
              <div className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Steel's Formula (2007)</div>
              <div className="font-mono text-sm text-foreground/80">{TMT_FORMULA}</div>
              <p className="text-xs text-muted-foreground mt-2">Adding an intention reduces Delay. A bundle reduces Impulsiveness.</p>
            </div>

            <div className="space-y-5 pb-10">
              <div className="space-y-2">
                <label className="text-sm font-medium">What needs to be done?</label>
                <Input
                  autoFocus
                  placeholder="Be specific — vague tasks trigger avoidance"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreate()}
                  className="text-base h-14"
                  style={{ background: "hsl(228 44% 15%)", border: "1px solid hsl(228 47% 22%)" }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Implementation Intention</label>
                  <span className="text-xs text-[#00C8FF] px-2 py-0.5 rounded-full" style={{ background: "rgba(0,200,255,0.1)" }}>+91% follow-through</span>
                </div>
                <Input
                  placeholder="When [situation], I will do this task..."
                  value={implementationIntention}
                  onChange={e => setImplementationIntention(e.target.value)}
                  style={{ background: "hsl(228 44% 15%)", border: "1px solid hsl(228 47% 22%)" }}
                />
                <p className="text-xs text-muted-foreground">Gollwitzer (1999): Specifying when-where-how multiplies execution rates by nearly 2×.</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Temptation Bundle</label>
                  <span className="text-xs text-[#A78BFA] px-2 py-0.5 rounded-full" style={{ background: "rgba(167,139,250,0.1)" }}>Milkman, 2014</span>
                </div>
                <Input
                  placeholder="I'll pair this with [something enjoyable]..."
                  value={temptationBundle}
                  onChange={e => setTemptationBundle(e.target.value)}
                  style={{ background: "hsl(228 44% 15%)", border: "1px solid hsl(228 47% 22%)" }}
                />
                <p className="text-xs text-muted-foreground">Pair this task with a TV show, podcast, or snack — makes dreaded tasks 51% more likely to be done.</p>
              </div>

              <Button
                className="w-full h-12 text-base font-semibold"
                onClick={handleCreate}
                disabled={createTask.isPending || !newTaskTitle.trim()}
                style={{ background: "#2B6BFF" }}
              >
                {createTask.isPending ? "Adding..." : "Lock It In"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Progress Bar */}
      {tasks && tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-5 rounded-2xl space-y-3"
          style={{ background: "hsl(228 44% 13%)", border: "1px solid hsl(228 47% 18%)" }}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Today's Progress</span>
            </div>
            <span className="text-2xl font-display font-bold" style={{ color: completionPct >= 80 ? "#00E5A0" : completionPct >= 40 ? "#2B6BFF" : "#F8A72A" }}>
              {completionPct}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(228 47% 18%)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: completionPct >= 80 ? "#00E5A0" : "#2B6BFF" }}
              initial={{ width: 0 }}
              animate={{ width: `${completionPct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completedTasks.length} completed</span>
            <span>{pendingTasks.length} remaining</span>
          </div>
          {taskStats && (
            <div className="flex gap-4 pt-1">
              <div className="text-xs text-muted-foreground">7-day avg: <span className="text-foreground font-medium">{taskStats.weeklyCompletionRate}%</span></div>
              <div className="text-xs text-muted-foreground">Current streak: <span className="text-foreground font-medium">{taskStats.currentStreak}d</span></div>
            </div>
          )}
        </motion.div>
      )}

      {/* Risk Card */}
      {risk && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-2xl flex gap-4 items-start"
          style={{ background: `${riskColor}10`, border: `1px solid ${riskColor}30` }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: riskColor }} />
          <div className="flex-1">
            <div className="font-semibold flex items-center gap-2">
              Risk: <span className="capitalize">{risk.level}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: riskColor, background: `${riskColor}18` }}>
                {risk.score}/100
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{risk.reason}</p>
            {risk.recommendations && risk.recommendations.length > 0 && (
              <div className="mt-3 space-y-1">
                {risk.recommendations.map((rec: string, i: number) => (
                  <div key={i} className="text-xs flex items-start gap-1.5">
                    <span style={{ color: riskColor }}>→</span>
                    <span className="text-muted-foreground">{rec}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* 2-Minute Tasks */}
      <AnimatePresence>
        {twoMinuteTasks.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider">2-Minute Tasks</h2>
              <span className="text-xs text-muted-foreground">— Do these first (Allen, 2001)</span>
            </div>
            <div className="space-y-2">
              {twoMinuteTasks.map(task => (
                <TaskCard key={task.id} task={task} onToggle={() => handleToggle(task.id, task.status)} onDelete={() => handleDelete(task.id)} isDeleting={deletingId === task.id} flash />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Tasks */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Up Next</h2>
        {normalTasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-10 text-center rounded-2xl"
            style={{ background: "hsl(228 44% 13%)", border: "1px solid hsl(228 47% 18%)" }}
          >
            <div className="text-4xl mb-3">🎯</div>
            <p className="font-semibold text-lg">No tasks yet</p>
            <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">Add a task above. Use an implementation intention ("When X, then Y") and you'll be 91% more likely to do it.</p>
          </motion.div>
        )}
        <AnimatePresence>
          {normalTasks.map((task, i) => (
            <TaskCard key={task.id} task={task} index={i} onToggle={() => handleToggle(task.id, task.status)} onDelete={() => handleDelete(task.id)} isDeleting={deletingId === task.id} />
          ))}
        </AnimatePresence>
      </div>

      {/* Completed */}
      {completedTasks.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-border/30">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Completed Today</h2>
          <div className="space-y-2">
            {completedTasks.map(task => (
              <TaskCard key={task.id} task={task} onToggle={() => handleToggle(task.id, task.status)} onDelete={() => handleDelete(task.id)} isDeleting={deletingId === task.id} dimmed />
            ))}
          </div>
          {completedTasks.length >= 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl text-center"
              style={{ background: "rgba(0,229,160,0.06)", border: "1px solid rgba(0,229,160,0.2)" }}
            >
              <p className="text-sm text-[#00E5A0] font-medium">Sirois & Pychyl (2013): Completing tasks releases dopamine and builds self-efficacy — the opposite of the procrastination cycle.</p>
            </motion.div>
          )}
        </div>
      )}

      {/* Science Cards */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">The Science Behind This</h2>
        </div>
        <div className="space-y-2">
          {SCIENCE_CARDS.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl overflow-hidden cursor-pointer"
              style={{ border: `1px solid ${card.color}25`, background: `${card.color}06` }}
              onClick={() => setExpandedScience(expandedScience === i ? null : i)}
            >
              <div className="p-4 flex items-center gap-3">
                <span className="text-xl">{card.icon}</span>
                <span className="font-semibold text-sm flex-1">{card.title}</span>
                {expandedScience === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
              <AnimatePresence>
                {expandedScience === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed"
                  >
                    {card.body}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, index = 0, onToggle, onDelete, isDeleting, flash = false, dimmed = false }: {
  task: any; index?: number; onToggle: () => void; onDelete: () => void; isDeleting?: boolean; flash?: boolean; dimmed?: boolean;
}) {
  const [showDelete, setShowDelete] = useState(false);
  const isComplete = task.status === "completed";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: dimmed ? 0.55 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ delay: index * 0.04 }}
      className="p-4 rounded-xl flex items-start gap-3 group"
      style={{
        background: flash ? "rgba(43,107,255,0.06)" : "hsl(228 44% 13%)",
        border: flash ? "1px solid rgba(43,107,255,0.25)" : "1px solid hsl(228 47% 18%)"
      }}
    >
      <button onClick={onToggle} className="mt-0.5 flex-shrink-0 transition-transform active:scale-90">
        {isComplete ? (
          <CheckCircle2 className="w-5 h-5 text-[#00E5A0]" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-sm ${isComplete ? "line-through text-muted-foreground" : ""}`}>
          {task.title}
        </div>
        {task.implementationIntention && !isComplete && (
          <div className="mt-1.5 text-xs flex items-start gap-1.5" style={{ color: "#00C8FF" }}>
            <Target className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>{task.implementationIntention}</span>
          </div>
        )}
        {task.temptationBundle && !isComplete && (
          <div className="mt-1 text-xs flex items-start gap-1.5" style={{ color: "#A78BFA" }}>
            <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>Bundle: {task.temptationBundle}</span>
          </div>
        )}
        {task.isTwoMinute && !isComplete && (
          <div className="mt-1 text-xs flex items-center gap-1" style={{ color: "#F8A72A" }}>
            <Clock className="w-3 h-3" /> 2-min task
          </div>
        )}
      </div>
      <button
        onClick={() => setShowDelete(s => !s)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
      >
        {showDelete ? (
          <button onClick={onDelete} disabled={isDeleting} className="text-xs text-[#FF4D6D] font-medium px-2 py-1 rounded" style={{ background: "rgba(255,77,109,0.1)" }}>
            {isDeleting ? "..." : "Delete"}
          </button>
        ) : (
          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-[#FF4D6D] transition-colors" />
        )}
      </button>
    </motion.div>
  );
}
