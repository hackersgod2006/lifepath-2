import { useState, useEffect, useRef } from "react";
import {
  useGetStreak, useGetTriggerMap, useLogUrge, useLogRelapse,
  getGetStreakQueryKey, getGetTriggerMapQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, AlertTriangle, Activity, Brain, Wind, ChevronDown, ChevronUp,
  BookOpen, Heart, Flame, Waves, Info, CheckCircle, Zap, Phone, Thermometer, Clock, X
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

const MILESTONES = [
  {
    day: 3,
    label: "72 Hours",
    title: "Acute Withdrawal Peaks",
    science: "Your dopamine receptors are 30–50% down-regulated (Koob & Volkow, 2016). The cravings you feel right now are neurological, not a character flaw. This is the hardest stretch.",
    brain: "Nucleus accumbens signaling drops sharply — producing the 'grey zone' anhedonia.",
    color: "#FF4D6D",
    icon: "⚡"
  },
  {
    day: 7,
    label: "1 Week",
    title: "Sleep Begins Normalizing",
    science: "Neuroinflammation from the substance starts reducing. REM sleep — the critical window for emotional processing — begins recovering (Walker, 2017). You may feel clear-headed in the mornings.",
    brain: "Prefrontal cortex (decision-making) is still impaired, but early BDNF recovery signals.",
    color: "#F8A72A",
    icon: "🌙"
  },
  {
    day: 14,
    label: "2 Weeks",
    title: "Receptor Density Recovering",
    science: "D2/D3 dopamine receptor density begins rebounding (Volkow et al., 2012). The brain's reward prediction system starts recalibrating to smaller, natural pleasures.",
    brain: "fMRI studies show striatal activity normalizing at this stage.",
    color: "#F8A72A",
    icon: "🔬"
  },
  {
    day: 30,
    label: "1 Month",
    title: "Executive Function Returns",
    science: "The prefrontal cortex — your brain's CEO for willpower and planning — significantly regains volume and function (Bechara, 2005). You can make better decisions under pressure.",
    brain: "Dopamine baseline approaching 70% of pre-addiction levels.",
    color: "#2B6BFF",
    icon: "🧠"
  },
  {
    day: 60,
    label: "2 Months",
    title: "Neuroplasticity Window",
    science: "This is the critical BDNF (brain-derived neurotrophic factor) surge. New neural pathways are forming at peak rate (Castrén, 2014). Habits built now are 3× more durable.",
    brain: "White matter integrity in key reward circuits is measurably improving.",
    color: "#00C8FF",
    icon: "⚡"
  },
  {
    day: 90,
    label: "3 Months",
    title: "Baseline Restored",
    science: "Lembke (2021) documents that 90 days of abstinence largely restores dopamine tone across all measured substance categories. You now feel pleasure from ordinary life again.",
    brain: "D2 receptor availability normalized in 80% of study participants at this stage.",
    color: "#00E5A0",
    icon: "✨"
  }
];

const HALT_INFO: Record<string, { title: string; desc: string; tip: string }> = {
  hungry: { title: "Hungry", desc: "Blood glucose drops impair prefrontal control, making the limbic 'impulse' brain take over (Hagger et al., 2010).", tip: "Eat something before the urge escalates. Even 20g protein resets cognitive clarity." },
  angry: { title: "Angry", desc: "Anger floods the amygdala with cortisol, suppressing the 'thinking' prefrontal cortex — identical to being mildly intoxicated (Arnsten, 2009).", tip: "4-7-8 breathing: Inhale 4s, hold 7s, exhale 8s. Activates vagal brake." },
  lonely: { title: "Lonely", desc: "Loneliness activates the same pain circuits as physical injury (Eisenberger, 2003). The brain seeks any dopamine hit to self-soothe.", tip: "Text one person. Not social media — direct human contact activates oxytocin." },
  tired: { title: "Tired", desc: "Sleep deprivation reduces glucose in the prefrontal cortex by 14% (Harrison & Horne, 2000). Willpower is a physical resource — and it's empty when tired.", tip: "A 20-min nap (setting alarm) is clinically more effective than caffeine." }
};

type BreathPhase = "idle" | "inhale" | "hold" | "exhale" | "complete";

function UrgeSurfingSession({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<BreathPhase>("idle");
  const [cycle, setCycle] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const TOTAL_CYCLES = 4;

  const PHASES: { phase: BreathPhase; duration: number; label: string; instruction: string }[] = [
    { phase: "inhale", duration: 4, label: "Breathe In", instruction: "Breathe in slowly through your nose" },
    { phase: "hold", duration: 7, label: "Hold", instruction: "Hold gently — feel the urge as a wave" },
    { phase: "exhale", duration: 8, label: "Breathe Out", instruction: "Slow exhale through your mouth" },
  ];

  const [phaseIdx, setPhaseIdx] = useState(0);

  const startSurfing = () => {
    setPhase("inhale");
    setCycle(1);
    setPhaseIdx(0);
    setSecondsLeft(4);
  };

  useEffect(() => {
    if (phase === "idle" || phase === "complete") return;
    if (secondsLeft <= 0) {
      const nextPhaseIdx = (phaseIdx + 1) % PHASES.length;
      if (nextPhaseIdx === 0) {
        const nextCycle = cycle + 1;
        if (nextCycle > TOTAL_CYCLES) {
          setPhase("complete");
          return;
        }
        setCycle(nextCycle);
      }
      setPhaseIdx(nextPhaseIdx);
      setSecondsLeft(PHASES[nextPhaseIdx].duration);
      setPhase(PHASES[nextPhaseIdx].phase);
      return;
    }
    timerRef.current = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [secondsLeft, phase, phaseIdx, cycle]);

  const currentPhaseData = PHASES[phaseIdx];
  const circleScale = phase === "inhale" ? 1.4 : phase === "hold" ? 1.4 : 0.8;

  return (
    <div className="flex flex-col items-center py-8 px-4 text-center space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-bold">Urge Surfing</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          ACT Therapy (Hayes, 2004): Urges peak and pass in 20–30 minutes. You don't fight them — you observe them, like waves.
        </p>
      </div>

      {phase === "idle" && (
        <div className="space-y-6 w-full max-w-xs">
          <div className="p-5 rounded-2xl text-left" style={{ background: "rgba(43,107,255,0.08)", border: "1px solid rgba(43,107,255,0.2)" }}>
            <div className="text-sm font-semibold text-primary mb-3">The 4-7-8 Protocol</div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex gap-2"><span className="text-primary font-mono">4s</span> — Inhale through nose</div>
              <div className="flex gap-2"><span className="text-[#00C8FF] font-mono">7s</span> — Hold and observe the urge</div>
              <div className="flex gap-2"><span className="text-[#00E5A0] font-mono">8s</span> — Exhale fully through mouth</div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground/70">Repeat 4 cycles · ~4 minutes total</div>
          </div>
          <Button className="w-full h-12 text-base font-semibold" style={{ background: "#2B6BFF" }} onClick={startSurfing}>
            Begin Surfing
          </Button>
        </div>
      )}

      {(phase === "inhale" || phase === "hold" || phase === "exhale") && (
        <div className="space-y-8">
          <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: phase === "inhale" ? "rgba(43,107,255,0.15)" : phase === "hold" ? "rgba(0,200,255,0.15)" : "rgba(0,229,160,0.15)" }}
              animate={{ scale: circleScale }}
              transition={{ duration: currentPhaseData.duration, ease: phase === "exhale" ? "easeIn" : "easeOut" }}
            />
            <motion.div
              className="absolute inset-4 rounded-full border-2"
              style={{ borderColor: phase === "inhale" ? "#2B6BFF" : phase === "hold" ? "#00C8FF" : "#00E5A0" }}
              animate={{ scale: circleScale, opacity: [0.6, 1, 0.6] }}
              transition={{ duration: currentPhaseData.duration, ease: "easeInOut" }}
            />
            <div className="relative text-center">
              <div className="text-4xl font-display font-bold">{secondsLeft}</div>
              <div className="text-sm font-semibold mt-1" style={{ color: phase === "inhale" ? "#2B6BFF" : phase === "hold" ? "#00C8FF" : "#00E5A0" }}>
                {currentPhaseData.label}
              </div>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">{currentPhaseData.instruction}</p>
          <div className="flex gap-2 justify-center">
            {Array.from({ length: TOTAL_CYCLES }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full transition-colors" style={{ background: i < cycle ? "#00E5A0" : "hsl(228 47% 22%)" }} />
            ))}
          </div>
          <div className="text-sm text-muted-foreground">Cycle {cycle} of {TOTAL_CYCLES}</div>
        </div>
      )}

      {phase === "complete" && (
        <div className="space-y-6 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
            <CheckCircle className="w-20 h-20 mx-auto text-[#00E5A0]" />
          </motion.div>
          <h3 className="text-2xl font-display font-bold">You Surfed It</h3>
          <p className="text-muted-foreground max-w-xs">The urge peaked and you observed it without acting. Each time you surf an urge instead of riding it, you weaken its neural pathway.</p>
          <div className="p-4 rounded-xl text-sm text-muted-foreground" style={{ background: "rgba(0,229,160,0.06)", border: "1px solid rgba(0,229,160,0.2)" }}>
            "Urge surfing teaches the brain that cravings are temporary, observable events — not commands." — Hayes, S.C. (2004). ACT Therapy.
          </div>
          <Button className="w-full h-12" style={{ background: "#00E5A0", color: "#0A0E1A" }} onClick={onClose}>Log as Resisted</Button>
        </div>
      )}
    </div>
  );
}

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
  const [isSurfingOpen, setIsSurfingOpen] = useState(false);
  const [expandedMilestone, setExpandedMilestone] = useState<number | null>(null);
  const [expandedHalt, setExpandedHalt] = useState<string | null>(null);

  const days = streak?.currentDays ?? 0;

  const handleLogUrge = () => {
    logUrge.mutate(
      { data: { intensity: intensity[0], haltState: halt as any, outcome: "resisted" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetTriggerMapQueryKey() });
          setIsUrgeSheetOpen(false);
          setIntensity([5]);
          setHalt([]);
          toast({ title: "Urge resisted and logged", description: "Your Life Score just improved. Each resist rewires your brain." });
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
          toast({
            title: "Relapse logged — no shame here",
            description: "Kristin Neff (2003): Self-compassion, not self-punishment, is what drives lasting recovery.",
            variant: "destructive"
          });
        }
      }
    );
  };

  if (streakLoading || mapLoading) {
    return <div className="p-6 space-y-4"><Skeleton className="h-40 w-full rounded-2xl bg-card" /><Skeleton className="h-64 w-full rounded-2xl bg-card" /></div>;
  }

  const currentMilestoneIdx = MILESTONES.reduce((acc, m, i) => days >= m.day ? i : acc, -1);
  const nextMilestone = MILESTONES.find(m => m.day > days);
  const daysToNext = nextMilestone ? nextMilestone.day - days : 0;

  const seesawAngle = Math.max(-30, Math.min(30, ((days / 90) * 60) - 30));

  return (
    <div className="p-5 md:p-8 max-w-2xl mx-auto space-y-8 pb-28">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-3xl font-display font-bold tracking-tight">Recovery</h1>
        <p className="text-muted-foreground text-sm mt-1">Dopamine Homeostasis · HALT Method · ACT Urge Surfing</p>
      </div>

      {/* Streak Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 rounded-3xl text-center relative overflow-hidden"
        style={{ background: "hsl(228 44% 13%)", border: "1px solid hsl(228 47% 18%)" }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 0%, rgba(43,107,255,0.08), transparent 70%)` }} />
        <div className="relative">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="text-8xl font-display font-bold mb-2"
            style={{ color: days >= 90 ? "#00E5A0" : days >= 30 ? "#2B6BFF" : days >= 7 ? "#F8A72A" : "#FF4D6D" }}
          >
            {days}
          </motion.div>
          <div className="text-lg text-muted-foreground font-medium uppercase tracking-widest mb-4">Days Clean</div>

          {nextMilestone && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm"
              style={{ background: `${nextMilestone.color}12`, border: `1px solid ${nextMilestone.color}30`, color: nextMilestone.color }}>
              <Flame className="w-3.5 h-3.5" />
              {daysToNext} days to {nextMilestone.label}
            </div>
          )}
        </div>
      </motion.div>

      {/* Dopamine Seesaw */}
      <div className="p-6 rounded-2xl space-y-6" style={{ background: "hsl(228 44% 13%)", border: "1px solid hsl(228 47% 18%)" }}>
        <div>
          <h2 className="font-display font-bold text-lg">Dopamine Seesaw</h2>
          <p className="text-xs text-muted-foreground mt-1">Lembke (2021) — "Dopamine Nation" · Koob & Volkow (2016)</p>
        </div>

        <div className="relative h-40 w-full flex flex-col items-center justify-center">
          {/* Labels */}
          <div className="absolute top-0 w-full flex justify-between text-xs text-muted-foreground px-2">
            <span style={{ color: "#FF4D6D" }}>⬇ Craving</span>
            <span style={{ color: "#00E5A0" }}>Baseline ⬆</span>
          </div>

          {/* Seesaw SVG */}
          <svg viewBox="0 0 300 120" className="w-full max-w-xs" style={{ height: 120 }}>
            {/* Fulcrum */}
            <polygon points="150,80 140,100 160,100" fill="hsl(228 47% 22%)" />
            <rect x="120" y="100" width="60" height="4" rx="2" fill="hsl(228 47% 22%)" />

            {/* Beam */}
            <motion.line
              x1="30" y1="70" x2="270" y2="70"
              stroke="hsl(228 47% 30%)"
              strokeWidth="3"
              strokeLinecap="round"
              animate={{ transform: `rotate(${seesawAngle}deg)`, transformOrigin: "150px 80px" }}
              transition={{ type: "spring", stiffness: 40, damping: 10 }}
            />

            {/* Dopamine labels */}
            <text x="50" y="50" textAnchor="middle" fontSize="9" fill="#FF4D6D" opacity="0.8">DOWN</text>
            <text x="50" y="62" textAnchor="middle" fontSize="7" fill="#FF4D6D" opacity="0.6">-regulated</text>
            <text x="250" y="50" textAnchor="middle" fontSize="9" fill="#00E5A0" opacity="0.8">HEALING</text>
            <text x="250" y="62" textAnchor="middle" fontSize="7" fill="#00E5A0" opacity="0.6">receptors</text>

            {/* Side indicators */}
            <motion.circle
              cx="55" cy="65"
              r="8"
              fill="rgba(255,77,109,0.2)"
              stroke="#FF4D6D"
              strokeWidth="1.5"
              animate={{ transform: `rotate(${seesawAngle}deg)`, transformOrigin: "150px 80px" }}
              transition={{ type: "spring", stiffness: 40, damping: 10 }}
            />
            <motion.circle
              cx="245" cy="65"
              r="8"
              fill="rgba(0,229,160,0.2)"
              stroke="#00E5A0"
              strokeWidth="1.5"
              animate={{ transform: `rotate(${seesawAngle}deg)`, transformOrigin: "150px 80px" }}
              transition={{ type: "spring", stiffness: 40, damping: 10 }}
            />
          </svg>
        </div>

        <div className="p-4 rounded-xl text-sm text-muted-foreground"
          style={{ background: "rgba(43,107,255,0.06)", border: "1px solid rgba(43,107,255,0.15)" }}>
          {days < 3
            ? "The seesaw is tipped hard toward craving. Your dopamine receptors are down-regulated — this is why everything feels dull. It's temporary and measurable."
            : days < 14
            ? "The beam is slowly leveling. Neuroinflammation is reducing. Small joys — food, music, sunlight — are beginning to register again."
            : days < 30
            ? "Equilibrium is returning. D2 receptor density is measurably rebounding. The anhedonia is lifting."
            : days < 90
            ? "Your baseline dopamine tone is largely restored. The prefrontal cortex is regaining executive function."
            : "Baseline restored. Your dopamine system is operating at pre-addiction levels. Protect what you've built."}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <Sheet open={isUrgeSheetOpen} onOpenChange={setIsUrgeSheetOpen}>
          <SheetTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl cursor-pointer"
              style={{ background: "rgba(43,107,255,0.08)", border: "1px solid rgba(43,107,255,0.25)" }}
            >
              <Activity className="w-6 h-6 text-primary" />
              <span className="text-sm font-semibold">Log Urge</span>
            </motion.button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl overflow-y-auto" style={{ background: "hsl(228 44% 10%)", border: "none" }}>
            <SheetHeader><SheetTitle className="font-display">Log an Urge</SheetTitle></SheetHeader>
            <div className="mt-4 space-y-6 pb-10">
              <div className="p-4 rounded-xl text-sm text-muted-foreground" style={{ background: "rgba(43,107,255,0.06)", border: "1px solid rgba(43,107,255,0.15)" }}>
                Every urge you log — even when resisted — trains you to observe your patterns. The HALT check tells you WHY it's happening.
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium">Intensity right now: <span className="text-primary">{intensity[0]}/10</span></label>
                <Slider value={intensity} onValueChange={setIntensity} max={10} min={1} step={1} className="py-4" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Mild noticing</span>
                  <span>Overwhelming</span>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium">H.A.L.T. Check — what's underneath?</label>
                <div className="grid grid-cols-2 gap-2">
                  {["hungry", "angry", "lonely", "tired"].map(h => (
                    <motion.button
                      key={h}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setHalt(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h])}
                      className="p-3 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: halt.includes(h) ? "rgba(43,107,255,0.2)" : "hsl(228 44% 15%)",
                        border: halt.includes(h) ? "1px solid #2B6BFF" : "1px solid hsl(228 47% 22%)",
                        color: halt.includes(h) ? "#2B6BFF" : undefined
                      }}
                    >
                      {h.charAt(0).toUpperCase() + h.slice(1)}
                    </motion.button>
                  ))}
                </div>
                {halt.length > 0 && (
                  <div className="space-y-2">
                    {halt.map(h => (
                      <div key={h} className="p-3 rounded-lg text-xs text-muted-foreground" style={{ background: "rgba(43,107,255,0.05)", border: "1px solid rgba(43,107,255,0.1)" }}>
                        <span className="text-primary font-semibold capitalize">{h}:</span> {HALT_INFO[h]?.tip}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button className="h-12 font-semibold" style={{ background: "#2B6BFF" }} onClick={handleLogUrge} disabled={logUrge.isPending}>
                  I Resisted
                </Button>
                <Button variant="outline" className="h-12 font-semibold" onClick={() => { setIsUrgeSheetOpen(false); setIsSurfingOpen(true); }}>
                  <Waves className="w-4 h-4 mr-2" /> Urge Surf
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={isSurfingOpen} onOpenChange={setIsSurfingOpen}>
          <SheetTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl cursor-pointer"
              style={{ background: "rgba(0,200,255,0.08)", border: "1px solid rgba(0,200,255,0.25)" }}
            >
              <Waves className="w-6 h-6 text-[#00C8FF]" />
              <span className="text-sm font-semibold">Urge Surf</span>
            </motion.button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl overflow-y-auto" style={{ background: "hsl(228 44% 10%)", border: "none" }}>
            <UrgeSurfingSession onClose={() => {
              setIsSurfingOpen(false);
              logUrge.mutate({ data: { intensity: 5, haltState: [], outcome: "resisted" } }, {
                onSuccess: () => {
                  queryClient.invalidateQueries({ queryKey: getGetTriggerMapQueryKey() });
                  toast({ title: "Urge surfed successfully", description: "You're rewriting your brain's automatic responses." });
                }
              });
            }} />
          </SheetContent>
        </Sheet>

        <Sheet open={isRelapseSheetOpen} onOpenChange={setIsRelapseSheetOpen}>
          <SheetTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl cursor-pointer"
              style={{ background: "rgba(255,77,109,0.07)", border: "1px solid rgba(255,77,109,0.2)" }}
            >
              <Heart className="w-6 h-6 text-[#FF4D6D]" />
              <span className="text-sm font-semibold text-[#FF4D6D]">Relapse</span>
            </motion.button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl" style={{ background: "hsl(228 44% 10%)", border: "none" }}>
            <SheetHeader><SheetTitle className="font-display text-[#FF4D6D]">Relapse Protocol</SheetTitle></SheetHeader>
            <div className="mt-6 space-y-5 pb-10">
              <div className="p-4 rounded-xl text-sm leading-relaxed text-muted-foreground" style={{ background: "rgba(255,77,109,0.06)", border: "1px solid rgba(255,77,109,0.2)" }}>
                <div className="font-semibold text-foreground mb-2">No shame. This is clinical reality.</div>
                Neff (2003) proved self-compassion outperforms self-criticism in driving recovery. Shame creates avoidance. Compassion creates accountability. You are human, not broken.
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">What preceded this? (H.A.L.T.)</label>
                <div className="grid grid-cols-2 gap-2">
                  {["hungry", "angry", "lonely", "tired"].map(h => (
                    <button
                      key={h}
                      onClick={() => setHalt(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h])}
                      className="p-3 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: halt.includes(h) ? "rgba(255,77,109,0.15)" : "hsl(228 44% 15%)",
                        border: halt.includes(h) ? "1px solid rgba(255,77,109,0.5)" : "1px solid hsl(228 47% 22%)",
                        color: halt.includes(h) ? "#FF4D6D" : undefined
                      }}
                    >
                      {h.charAt(0).toUpperCase() + h.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full h-12 font-semibold" style={{ background: "#FF4D6D" }} onClick={handleRelapse} disabled={logRelapse.isPending}>
                {logRelapse.isPending ? "Logging..." : "Log Relapse & Start Again"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* HALT Map */}
      {triggerMap && (
        <div className="space-y-4">
          <div>
            <h2 className="font-display font-bold text-lg">H.A.L.T. Trigger Map</h2>
            <p className="text-xs text-muted-foreground mt-1">Clinical recovery technique — understanding what state precedes your urges</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "hungry", value: triggerMap.haltBreakdown?.hungry ?? 0, color: "#F8A72A" },
              { key: "angry", value: triggerMap.haltBreakdown?.angry ?? 0, color: "#FF4D6D" },
              { key: "lonely", value: triggerMap.haltBreakdown?.lonely ?? 0, color: "#2B6BFF" },
              { key: "tired", value: triggerMap.haltBreakdown?.tired ?? 0, color: "#A78BFA" },
            ].map(item => {
              const info = HALT_INFO[item.key];
              const isExpanded = expandedHalt === item.key;
              return (
                <motion.div
                  key={item.key}
                  className="p-4 rounded-2xl cursor-pointer"
                  style={{ background: "hsl(228 44% 13%)", border: `1px solid ${item.color}25` }}
                  onClick={() => setExpandedHalt(isExpanded ? null : item.key)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-display font-bold" style={{ color: item.color }}>{item.value}</div>
                      <div className="text-xs text-muted-foreground uppercase mt-1">{info.title}</div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-3 text-xs text-muted-foreground leading-relaxed overflow-hidden"
                      >
                        {info.desc}
                        <div className="mt-2 font-medium text-foreground/80">→ {info.tip}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Neurological Timeline */}
      <div className="space-y-4">
        <div>
          <h2 className="font-display font-bold text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#00C8FF]" /> Neurological Recovery Timeline
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Volkow et al. (2012), Koob & Volkow (2016), Lembke (2021)</p>
        </div>
        <div className="relative ml-4 border-l-2 border-border/50 space-y-1 py-2">
          {MILESTONES.map((m, i) => {
            const achieved = days >= m.day;
            const isCurrent = i === currentMilestoneIdx + 1 || (currentMilestoneIdx === -1 && i === 0);
            const isExpanded = expandedMilestone === i;
            return (
              <div key={i} className="relative pl-8 pb-6">
                {/* Timeline dot */}
                <div
                  className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all"
                  style={{
                    background: achieved ? m.color : "hsl(228 44% 13%)",
                    borderColor: achieved ? m.color : "hsl(228 47% 22%)",
                    boxShadow: isCurrent ? `0 0 12px ${m.color}60` : undefined
                  }}
                />

                <motion.div
                  className="rounded-2xl p-4 cursor-pointer"
                  style={{
                    background: achieved ? `${m.color}08` : "hsl(228 44% 13%)",
                    border: `1px solid ${achieved ? m.color + "30" : "hsl(228 47% 18%)"}`,
                    opacity: achieved ? 1 : 0.6
                  }}
                  onClick={() => setExpandedMilestone(isExpanded ? null : i)}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{m.icon}</span>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: achieved ? m.color : undefined }}>{m.label}</div>
                        <div className="text-xs text-muted-foreground">{m.title}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {achieved && <CheckCircle className="w-4 h-4" style={{ color: m.color }} />}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 space-y-3 text-sm text-muted-foreground leading-relaxed">
                          <p>{m.science}</p>
                          <div className="p-3 rounded-lg text-xs font-mono" style={{ background: "rgba(43,107,255,0.06)", border: "1px solid rgba(43,107,255,0.15)" }}>
                            🔬 {m.brain}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Emergency Toolkit — floating button */}
      <EmergencyToolkit />
    </div>
  );
}

function EmergencyToolkit() {
  const [open, setOpen] = useState(false);
  const [tool, setTool] = useState<string | null>(null);
  const [breathPhase, setBreathPhase] = useState<"idle"|"active"|"done">("idle");
  const [breathCount, setBreathCount] = useState(0);
  const [delayActive, setDelayActive] = useState(false);
  const [delaySeconds, setDelaySeconds] = useState(900);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const TOOLS = [
    { id: "box-breathing", icon: Wind, label: "Box Breathing", color: "#2B6BFF", desc: "4-4-4-4 rhythm activates the vagal brake (Porges, 2011)" },
    { id: "delay", icon: Clock, label: "15-Minute Delay", color: "#00C8FF", desc: "Urges peak in minutes. Delay = ride the wave (Hayes, 2004)" },
    { id: "halt", icon: Brain, label: "HALT Assessment", color: "#F8A72A", desc: "Identify the real need beneath the urge" },
    { id: "cold", icon: Thermometer, label: "Cold Protocol", color: "#A78BFA", desc: "Cold exposure triggers norepinephrine + endorphin release" },
    { id: "contact", icon: Phone, label: "Accountability", color: "#00E5A0", desc: "Loneliness is trigger #1 — break isolation immediately" },
  ];

  useEffect(() => {
    if (!delayActive) return;
    timerRef.current = setInterval(() => {
      setDelaySeconds(s => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          setDelayActive(false);
          return 900;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current!); };
  }, [delayActive]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-5 md:bottom-8 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm shadow-lg"
        style={{ background: "linear-gradient(135deg, #FF4D6D, #F8A72A)", color: "white" }}
      >
        <Zap className="w-4 h-4" />
        Emergency Toolkit
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={() => { setOpen(false); setTool(null); }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{ background: "#0D1220", border: "1px solid rgba(255,77,109,0.3)" }}
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                <div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-red-400" />
                    <h2 className="font-display font-bold text-white">Emergency Toolkit</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Science-backed tools for right now</p>
                </div>
                <button onClick={() => { setOpen(false); setTool(null); }} className="text-muted-foreground hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
                {!tool ? (
                  TOOLS.map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTool(t.id)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all hover:scale-[1.01]"
                        style={{ background: `${t.color}10`, border: `1px solid ${t.color}30` }}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${t.color}20` }}>
                          <Icon className="w-5 h-5" style={{ color: t.color }} />
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">{t.label}</p>
                          <p className="text-xs text-muted-foreground">{t.desc}</p>
                        </div>
                      </button>
                    );
                  })
                ) : tool === "box-breathing" ? (
                  <div className="text-center space-y-6 py-4">
                    <h3 className="font-bold text-white">Box Breathing (4-4-4-4)</h3>
                    <p className="text-xs text-muted-foreground">Military-grade stress reset. Activates parasympathetic nervous system via vagal nerve stimulation (Porges, 2011).</p>
                    <div className="flex justify-center">
                      <motion.div
                        className="w-24 h-24 rounded-2xl flex items-center justify-center text-2xl font-bold border-4"
                        animate={breathPhase === "active" ? { scale: [1, 1.3, 1.3, 1], borderRadius: ["16px", "50%", "50%", "16px"] } : {}}
                        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                        style={{ borderColor: "#2B6BFF", color: "#2B6BFF" }}
                      >
                        {breathPhase === "idle" ? <Wind className="w-8 h-8" /> : breathCount}
                      </motion.div>
                    </div>
                    {breathPhase === "idle" && (
                      <Button onClick={() => { setBreathPhase("active"); setBreathCount(4); }} style={{ background: "#2B6BFF" }}>
                        Start Box Breathing
                      </Button>
                    )}
                    {breathPhase === "active" && <p className="text-muted-foreground text-sm">Breathe in 4 → Hold 4 → Breathe out 4 → Hold 4</p>}
                    <button onClick={() => setTool(null)} className="text-xs text-muted-foreground underline">← Back</button>
                  </div>
                ) : tool === "delay" ? (
                  <div className="text-center space-y-6 py-4">
                    <h3 className="font-bold text-white">15-Minute Delay</h3>
                    <p className="text-xs text-muted-foreground">Urges follow a wave pattern — they always peak and pass. Delay just 15 minutes. The urge will subside (Hayes, ACT, 2004).</p>
                    <div className="text-5xl font-display font-bold" style={{ color: "#00C8FF" }}>
                      {formatTime(delaySeconds)}
                    </div>
                    {!delayActive ? (
                      <Button onClick={() => { setDelayActive(true); setDelaySeconds(900); }} style={{ background: "#00C8FF", color: "#0A0E1A" }}>
                        Start 15-Minute Timer
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">Stay with it. This feeling is temporary.</p>
                    )}
                    <button onClick={() => setTool(null)} className="text-xs text-muted-foreground underline">← Back</button>
                  </div>
                ) : tool === "halt" ? (
                  <div className="space-y-4 py-2">
                    <h3 className="font-bold text-white">HALT Check</h3>
                    <p className="text-xs text-muted-foreground">Most relapses are not about the substance — they're about an unmet biological need. Check each:</p>
                    {["Hungry", "Angry", "Lonely", "Tired"].map((state, i) => {
                      const colors = ["#F8A72A", "#FF4D6D", "#A78BFA", "#00C8FF"];
                      const tips = [
                        "Eat 20g of protein + drink water before doing anything else.",
                        "4-7-8 breathing: Inhale 4s, hold 7s, exhale 8s. Calms amygdala.",
                        "Text one real person right now. Not social media. One message.",
                        "Lie down for 20 minutes. Set an alarm. Rest > willpower when exhausted."
                      ];
                      return (
                        <div key={state} className="p-4 rounded-xl" style={{ background: `${colors[i]}10`, border: `1px solid ${colors[i]}25` }}>
                          <p className="font-semibold text-sm" style={{ color: colors[i] }}>Am I {state}?</p>
                          <p className="text-xs text-muted-foreground mt-1">{tips[i]}</p>
                        </div>
                      );
                    })}
                    <button onClick={() => setTool(null)} className="text-xs text-muted-foreground underline">← Back</button>
                  </div>
                ) : tool === "cold" ? (
                  <div className="space-y-4 py-2">
                    <h3 className="font-bold text-white">Cold Exposure Protocol</h3>
                    <p className="text-sm text-muted-foreground">Cold exposure raises norepinephrine by 200-300% and triggers endorphin release — creating a natural dopamine alternative (Huberman, 2021).</p>
                    <div className="space-y-3">
                      {[
                        { step: "1", text: "Turn shower to cold (or as cold as possible)", time: "0s" },
                        { step: "2", text: "Step in fully. Do not hesitate — the decision is made.", time: "0s" },
                        { step: "3", text: "Control your breathing. Exhale slowly. Stay for 30 seconds.", time: "30s" },
                        { step: "4", text: "Gradually increase to 2-3 minutes over sessions.", time: "2-3 min" },
                      ].map(s => (
                        <div key={s.step} className="flex gap-3 items-start">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5" style={{ background: "rgba(167,139,250,0.2)", color: "#A78BFA" }}>{s.step}</div>
                          <div>
                            <p className="text-sm text-white">{s.text}</p>
                            {s.time !== "0s" && <p className="text-xs text-muted-foreground">{s.time}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setTool(null)} className="text-xs text-muted-foreground underline">← Back</button>
                  </div>
                ) : tool === "contact" ? (
                  <div className="space-y-4 py-2">
                    <h3 className="font-bold text-white">Break the Isolation</h3>
                    <p className="text-sm text-muted-foreground">Loneliness activates the same pain circuits as physical injury (Eisenberger, 2003). Human connection interrupts the urge loop.</p>
                    <div className="p-4 rounded-xl space-y-2" style={{ background: "rgba(0,229,160,0.08)", border: "1px solid rgba(0,229,160,0.2)" }}>
                      <p className="font-semibold text-sm text-white">Do one of these right now:</p>
                      {[
                        "Text a friend: 'Hey, thinking of you'",
                        "Call someone — voice, not text",
                        "Go to a public place (café, library)",
                        "Join the LifePath body doubling room",
                        "Write in your journal (you are not alone in this)",
                      ].map((a, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#00E5A0" }} />
                          {a}
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setTool(null)} className="text-xs text-muted-foreground underline">← Back</button>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
