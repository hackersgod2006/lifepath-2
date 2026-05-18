import { useState } from "react";
import { useGetTasks, useCreateTask, useUpdateTask, useGetProcrastinationRisk, getGetTasksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Plus, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function Tasks() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: tasks, isLoading: tasksLoading } = useGetTasks();
  const { data: risk, isLoading: riskLoading } = useGetProcrastinationRisk();
  
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [implementationIntention, setImplementationIntention] = useState("");
  const [temptationBundle, setTemptationBundle] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleCreate = () => {
    if (!newTaskTitle.trim()) return;
    createTask.mutate(
      { data: { 
          title: newTaskTitle,
          implementationIntention: implementationIntention || undefined,
          temptationBundle: temptationBundle || undefined
      } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
          setNewTaskTitle("");
          setImplementationIntention("");
          setTemptationBundle("");
          setIsSheetOpen(false);
          toast({ title: "Task created" });
        }
      }
    );
  };

  const handleToggle = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    updateTask.mutate(
      { id, data: { status: newStatus as any } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
          if (newStatus === "completed") {
            toast({ title: "Task completed", description: "Nice work." });
          }
        }
      }
    );
  };

  if (tasksLoading || riskLoading) {
    return <div className="p-6 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-40 w-full" /></div>;
  }

  const pendingTasks = tasks?.filter(t => t.status === "pending" || t.status === "snoozed") || [];
  const completedTasks = tasks?.filter(t => t.status === "completed") || [];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 pb-24">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-bold">Procrastination Killer</h1>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button size="icon" className="rounded-full h-12 w-12 shadow-lg hover-elevate">
              <Plus className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] bg-card border-t-border rounded-t-3xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="font-display">New Task</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4 pb-10">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Task Title</label>
                <Input 
                  placeholder="What needs to be done?" 
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="text-lg h-14 bg-background border-border"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Implementation Intention (Optional)</label>
                <Input 
                  placeholder="When X happens, I will..." 
                  value={implementationIntention}
                  onChange={e => setImplementationIntention(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Temptation Bundle (Optional)</label>
                <Input 
                  placeholder="I'll pair this with..." 
                  value={temptationBundle}
                  onChange={e => setTemptationBundle(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <Button className="w-full h-12 mt-4" onClick={handleCreate} disabled={createTask.isPending || !newTaskTitle.trim()}>
                Create Task
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {risk && (
        <div className="p-4 rounded-2xl bg-card border border-border flex items-start gap-4">
          <div className={`p-2 rounded-full ${risk.level === 'high' ? 'bg-destructive/10 text-destructive' : risk.level === 'medium' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              Procrastination Risk: <span className="capitalize">{risk.level}</span>
            </h3>
            <p className="text-muted-foreground text-sm mt-1">{risk.reason}</p>
          </div>
        </div>
      )}

      {pendingTasks.filter(t => t.isTwoMinute).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4" /> 2-Minute Tasks
          </h2>
          <div className="space-y-2">
            {pendingTasks.filter(t => t.isTwoMinute).map(task => (
              <TaskCard key={task.id} task={task} onToggle={() => handleToggle(task.id, task.status)} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Up Next</h2>
        {pendingTasks.filter(t => !t.isTwoMinute).length === 0 ? (
          <div className="p-8 text-center bg-card rounded-2xl border border-border">
            <p className="text-muted-foreground">No tasks pending. You're all caught up.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {pendingTasks.filter(t => !t.isTwoMinute).map((task, i) => (
                <TaskCard key={task.id} task={task} index={i} onToggle={() => handleToggle(task.id, task.status)} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {completedTasks.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-border/50">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Completed</h2>
          <div className="space-y-2 opacity-60">
            {completedTasks.map(task => (
              <TaskCard key={task.id} task={task} onToggle={() => handleToggle(task.id, task.status)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, index = 0, onToggle }: { task: any, index?: number, onToggle: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      className="p-4 bg-card rounded-xl border border-border flex items-center gap-4 hover-elevate transition-all group"
    >
      <button onClick={onToggle} className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
        {task.status === "completed" ? (
          <CheckCircle2 className="w-6 h-6 text-success" />
        ) : (
          <Circle className="w-6 h-6" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <h4 className={`font-medium truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
          {task.title}
        </h4>
        {task.implementationIntention && task.status !== 'completed' && (
          <p className="text-xs text-secondary mt-1 truncate">🎯 {task.implementationIntention}</p>
        )}
        {task.temptationBundle && task.status !== 'completed' && (
          <p className="text-xs text-warning mt-1 truncate">🎁 {task.temptationBundle}</p>
        )}
      </div>
    </motion.div>
  );
}
