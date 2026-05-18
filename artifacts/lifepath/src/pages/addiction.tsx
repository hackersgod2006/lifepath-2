import { useState } from "react";
import { useGetStreak, useGetTriggerMap, useLogUrge, useLogRelapse, getGetStreakQueryKey, getGetTriggerMapQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, Activity, Brain } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function Addiction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: streak, isLoading: streakLoading } = useGetStreak();
  const { data: triggerMap, isLoading: mapLoading } = useGetTriggerMap();

  const logUrge = useLogUrge();
  const logRelapse = useLogRelapse();

  const [intensity, setIntensity] = useState([5]);
  const [halt, setHalt] = useState<string[]>([]);
  const [isUrgeSheetOpen, setIsUrgeSheetOpen] = useState(false);
  const [isRelapseSheetOpen, setIsRelapseSheetOpen] = useState(false);

  if (streakLoading || mapLoading) {
    return <div className="p-6 space-y-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  const days = streak?.currentDays || 0;
  const seesawTilt = Math.min(Math.max((days / 30) * 30 - 30, -30), 0);

  const handleLogUrge = () => {
    logUrge.mutate(
      { data: { intensity: intensity[0], haltState: halt as any, outcome: "resisted" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTriggerMapQueryKey() });
          setIsUrgeSheetOpen(false);
          setIntensity([5]);
          setHalt([]);
          toast({ title: "Urge logged", description: "You resisted. That's a win." });
        }
      }
    );
  };

  const handleRelapse = () => {
    logRelapse.mutate(
      { data: { triggeredBy: halt } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetStreakQueryKey() });
          setIsRelapseSheetOpen(false);
          setHalt([]);
          toast({ title: "Relapse logged", description: "Recovery is not linear. Tomorrow is a new day.", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 pb-24">
      <div className="text-center space-y-2 pt-4">
        <h1 className="text-6xl font-display font-bold tracking-tighter text-primary">
          {days}
        </h1>
        <p className="text-xl text-muted-foreground font-medium uppercase tracking-widest">
          Days Clean
        </p>
      </div>

      <div className="p-6 bg-card rounded-3xl border border-border space-y-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-display font-semibold text-lg">Dopamine Balance</h2>
          <span className="text-sm text-muted-foreground">Recovery Phase</span>
        </div>
        
        <div className="relative h-32 w-full flex items-center justify-center">
          <motion.div 
            className="w-48 h-2 bg-gradient-to-r from-destructive to-success rounded-full origin-center relative"
            initial={{ rotate: -30 }}
            animate={{ rotate: seesawTilt }}
            transition={{ type: "spring", stiffness: 50 }}
          >
            <div className="absolute left-1/2 -ml-2 top-2 w-4 h-8 bg-muted-foreground" style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}></div>
            <div className="absolute -left-4 -top-6 w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center border border-destructive">
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
            <div className="absolute -right-4 -top-6 w-8 h-8 rounded-full bg-success/20 flex items-center justify-center border border-success">
              <Shield className="w-4 h-4 text-success" />
            </div>
          </motion.div>
        </div>
        <p className="text-sm text-center text-muted-foreground">
          {days < 14 ? "Your receptors are down-regulated. Cravings are normal. Keep pushing." : 
           days < 30 ? "Equilibrium is returning. Notice the small joys today." : 
           "Baseline restored. Protect your peace."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Sheet open={isUrgeSheetOpen} onOpenChange={setIsUrgeSheetOpen}>
          <SheetTrigger asChild>
            <Button size="lg" className="h-16 bg-card border-border hover:border-primary/50 text-foreground" variant="outline">
              <Activity className="w-5 h-5 mr-2 text-primary" />
              Log Urge
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] bg-card border-t-border rounded-t-3xl">
            <SheetHeader>
              <SheetTitle className="font-display">Log Urge</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <div className="space-y-4">
                <label className="text-sm font-medium text-muted-foreground">Intensity: {intensity[0]}/10</label>
                <Slider value={intensity} onValueChange={setIntensity} max={10} min={1} step={1} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">H.A.L.T. Check (Select all that apply)</label>
                <div className="grid grid-cols-2 gap-2">
                  {["hungry", "angry", "lonely", "tired"].map(h => (
                    <Button 
                      key={h} 
                      variant={halt.includes(h) ? "default" : "outline"} 
                      onClick={() => setHalt(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h])}
                      className="uppercase text-xs"
                    >
                      {h}
                    </Button>
                  ))}
                </div>
              </div>
              <Button className="w-full h-12" onClick={handleLogUrge} disabled={logUrge.isPending}>Save</Button>
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={isRelapseSheetOpen} onOpenChange={setIsRelapseSheetOpen}>
          <SheetTrigger asChild>
            <Button size="lg" className="h-16 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive border-transparent" variant="outline">
              Log Relapse
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[60vh] bg-card border-t-border rounded-t-3xl">
            <SheetHeader>
              <SheetTitle className="font-display text-destructive">Log Relapse</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <p className="text-muted-foreground text-sm">Be honest. No shame.</p>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">What triggered this?</label>
                <div className="grid grid-cols-2 gap-2">
                  {["hungry", "angry", "lonely", "tired"].map(h => (
                    <Button 
                      key={h} 
                      variant={halt.includes(h) ? "default" : "outline"} 
                      onClick={() => setHalt(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h])}
                      className="uppercase text-xs"
                    >
                      {h}
                    </Button>
                  ))}
                </div>
              </div>
              <Button className="w-full h-12" variant="destructive" onClick={handleRelapse} disabled={logRelapse.isPending}>Reset Counter</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {triggerMap && (
        <div className="space-y-4">
          <h2 className="font-display font-semibold text-lg">H.A.L.T. Trigger Map</h2>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Hungry', value: triggerMap.haltBreakdown.hungry },
              { label: 'Angry', value: triggerMap.haltBreakdown.angry },
              { label: 'Lonely', value: triggerMap.haltBreakdown.lonely },
              { label: 'Tired', value: triggerMap.haltBreakdown.tired },
            ].map(item => (
              <div key={item.label} className="p-3 bg-card rounded-xl border border-border flex flex-col items-center">
                <div className="text-xl font-bold">{item.value}</div>
                <div className="text-xs text-muted-foreground uppercase mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {streak?.milestones && streak.milestones.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display font-semibold text-lg flex items-center gap-2"><Brain className="w-5 h-5" /> Neurological Timeline</h2>
          <div className="relative border-l-2 border-border ml-3 pl-6 space-y-6 py-2">
            {streak.milestones.map((m, i) => (
              <div key={i} className="relative">
                <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 border-background ${m.achieved ? 'bg-primary' : 'bg-muted'}`}></div>
                <div className={`font-semibold ${m.achieved ? 'text-primary' : 'text-muted-foreground'}`}>{m.label} (Day {m.day})</div>
                <p className="text-sm text-muted-foreground mt-1">{m.scienceFact}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
