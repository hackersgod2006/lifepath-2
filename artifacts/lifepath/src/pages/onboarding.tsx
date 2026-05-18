import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCompleteOnboarding } from "@workspace/api-client-react";

const STEPS = ["splash", "science", "struggle", "duration", "impact", "name", "reveal"];

const SCIENCE_FACTS = [
  { icon: "🧠", stat: "91%", desc: "More likely to follow through with implementation intentions", source: "Gollwitzer, 1999" },
  { icon: "⚡", stat: "37×", desc: "Better outcomes from 1% daily improvement over a year", source: "Clear, 2018" },
  { icon: "🔄", stat: "66 days", desc: "The real average to form a habit (not 21)", source: "Lally et al., 2010" },
];

function AnimatedScore({ target }: { target: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const dur = 2000;
    const tick = () => {
      const t = Math.min((Date.now() - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(eased * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [target]);
  return <>{n}</>;
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [stepIndex, setStepIndex] = useState(0);
  const [scienceFact, setScienceFact] = useState(0);
  const [data, setData] = useState({
    name: "",
    biggestStruggle: "",
    struggleDuration: "",
    triedBefore: "",
    changeStatement: ""
  });

  const completeMutation = useCompleteOnboarding();

  useEffect(() => {
    if (localStorage.getItem("lifepath_onboarded") === "true") {
      setLocation("/dashboard");
    }
  }, [setLocation]);

  useEffect(() => {
    if (STEPS[stepIndex] !== "science") return;
    const id = setInterval(() => setScienceFact(f => (f + 1) % SCIENCE_FACTS.length), 2800);
    return () => clearInterval(id);
  }, [stepIndex]);

  const next = () => setStepIndex(i => Math.min(i + 1, STEPS.length - 1));

  const initialScore = data.biggestStruggle === "all_of_the_above" ? 22 :
    data.biggestStruggle === "procrastination" ? 35 :
    data.biggestStruggle === "compulsive_habits" ? 28 : 38;

  const handleComplete = () => {
    completeMutation.mutate(
      {
        data: {
          name: data.name,
          biggestStruggle: data.biggestStruggle as any,
          struggleDuration: data.struggleDuration as any,
          triedBefore: data.triedBefore as any,
          changeStatement: data.changeStatement,
          addictionType: data.biggestStruggle === "compulsive_habits" ? "social_media" : undefined
        }
      },
      {
        onSuccess: () => {
          localStorage.setItem("lifepath_onboarded", "true");
          setLocation("/dashboard");
        }
      }
    );
  };

  const currentStep = STEPS[stepIndex];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "#0A0E1A" }}>
      {/* Background radial */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-5 blur-3xl" style={{ background: "#2B6BFF" }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-5 blur-3xl" style={{ background: "#00C8FF" }} />
      </div>

      {/* Progress dots */}
      {stepIndex > 0 && stepIndex < STEPS.length - 1 && (
        <div className="absolute top-8 flex gap-2">
          {STEPS.slice(1, -1).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full transition-all duration-300"
              style={{ background: i < stepIndex - 1 ? "#2B6BFF" : i === stepIndex - 1 ? "#00C8FF" : "rgba(255,255,255,0.2)" }}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Splash */}
        {currentStep === "splash" && (
          <motion.div
            key="splash"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-xl text-center space-y-10"
          >
            <div className="space-y-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-5xl mb-4"
              >
                🧬
              </motion.div>
              <h1 className="text-4xl md:text-6xl font-display font-extrabold leading-tight tracking-tight">
                Most apps treat symptoms.<br />
                <span style={{ color: "#2B6BFF" }}>LifePath treats you.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
                Built entirely on peer-reviewed research. Three science modules working together to fix what life breaks.
              </p>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                size="lg"
                className="px-12 h-14 text-lg font-semibold rounded-2xl"
                style={{ background: "#2B6BFF" }}
                onClick={next}
              >
                Begin
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex gap-8 justify-center text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">🔬 Peer-reviewed</div>
              <div className="flex items-center gap-2">🔒 Private</div>
              <div className="flex items-center gap-2">⚡ Free</div>
            </motion.div>
          </motion.div>
        )}

        {/* Science Teaser */}
        {currentStep === "science" && (
          <motion.div
            key="science"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-sm space-y-8 text-center"
          >
            <h2 className="text-2xl font-display font-bold">What the research actually says</h2>
            <div className="relative h-40">
              <AnimatePresence mode="wait">
                <motion.div
                  key={scienceFact}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="absolute inset-0 flex flex-col items-center justify-center p-6 rounded-2xl"
                  style={{ background: "hsl(228 44% 13%)", border: "1px solid rgba(43,107,255,0.2)" }}
                >
                  <div className="text-3xl mb-2">{SCIENCE_FACTS[scienceFact].icon}</div>
                  <div className="text-4xl font-display font-bold text-primary mb-2">{SCIENCE_FACTS[scienceFact].stat}</div>
                  <p className="text-sm text-muted-foreground">{SCIENCE_FACTS[scienceFact].desc}</p>
                  <p className="text-xs text-muted-foreground/50 mt-2 font-mono">{SCIENCE_FACTS[scienceFact].source}</p>
                </motion.div>
              </AnimatePresence>
            </div>
            <Button className="w-full h-12 font-semibold" style={{ background: "#2B6BFF" }} onClick={next}>
              I'm ready
            </Button>
          </motion.div>
        )}

        {/* Biggest Struggle */}
        {currentStep === "struggle" && (
          <motion.div
            key="struggle"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-bold">What is your single biggest invisible struggle?</h2>
              <p className="text-muted-foreground text-sm">This shapes which science modules get activated for you.</p>
            </div>
            <div className="space-y-3">
              {[
                { id: "procrastination", label: "Procrastination", desc: "You know what to do. You just can't start.", icon: "⏳" },
                { id: "compulsive_habits", label: "Compulsive Habits", desc: "Social media, substances, or any loop you can't break.", icon: "🔄" },
                { id: "cant_focus", label: "Can't Focus", desc: "Scattered attention, ADHD traits, distraction overwhelm.", icon: "💨" },
                { id: "all_of_the_above", label: "All of the above", desc: "It's a system failure — everything feeds everything.", icon: "⚡" },
              ].map(opt => (
                <motion.button
                  key={opt.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full p-4 text-left rounded-xl flex items-center gap-4 transition-all"
                  style={{ background: "hsl(228 44% 13%)", border: "1px solid hsl(228 47% 22%)" }}
                  onClick={() => { setData(d => ({ ...d, biggestStruggle: opt.id })); next(); }}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <div>
                    <div className="font-semibold">{opt.label}</div>
                    <div className="text-sm text-muted-foreground">{opt.desc}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Duration */}
        {currentStep === "duration" && (
          <motion.div
            key="duration"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-bold">How long has this been affecting your life?</h2>
              <p className="text-sm text-muted-foreground">Lally et al. (2010): The longer the pattern, the longer the recovery — but also the greater the transformation.</p>
            </div>
            <div className="space-y-3">
              {[
                { id: "weeks", label: "A few weeks", desc: "Early stage — patterns are still soft and malleable.", icon: "🌱" },
                { id: "months", label: "Several months", desc: "The habit loop is established but breakable.", icon: "🌿" },
                { id: "years", label: "Years", desc: "Deep grooves — requires systematic, science-backed rewiring.", icon: "🌳" },
              ].map(opt => (
                <motion.button
                  key={opt.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full p-4 text-left rounded-xl flex items-center gap-4"
                  style={{ background: "hsl(228 44% 13%)", border: "1px solid hsl(228 47% 22%)" }}
                  onClick={() => { setData(d => ({ ...d, struggleDuration: opt.id })); next(); }}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <div>
                    <div className="font-semibold">{opt.label}</div>
                    <div className="text-sm text-muted-foreground">{opt.desc}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Impact */}
        {currentStep === "impact" && (
          <motion.div
            key="impact"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-bold">What would fixing this change in your life?</h2>
              <p className="text-sm text-muted-foreground">Oettingen (2014) — WOOP method: Naming the specific outcome activates motivational pathways in the prefrontal cortex.</p>
            </div>
            <div className="space-y-4">
              <Input
                autoFocus
                placeholder="I could finally start my business, get healthy, show up as a parent..."
                value={data.changeStatement}
                onChange={e => setData(d => ({ ...d, changeStatement: e.target.value.slice(0, 120) }))}
                className="h-14 text-base"
                style={{ background: "hsl(228 44% 13%)", border: "1px solid hsl(228 47% 22%)" }}
              />
              <div className="text-right text-xs text-muted-foreground">{data.changeStatement.length}/120</div>
              <Button
                className="w-full h-12 font-semibold"
                style={{ background: "#2B6BFF" }}
                disabled={!data.changeStatement.trim()}
                onClick={next}
              >
                This is what I'm working toward
              </Button>
            </div>
          </motion.div>
        )}

        {/* Name */}
        {currentStep === "name" && (
          <motion.div
            key="name"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md space-y-6"
          >
            <h2 className="text-2xl font-display font-bold">What is your name?</h2>
            <div className="space-y-4">
              <Input
                autoFocus
                placeholder="Your first name"
                value={data.name}
                onChange={e => setData(d => ({ ...d, name: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && data.name && next()}
                className="h-14 text-base"
                style={{ background: "hsl(228 44% 13%)", border: "1px solid hsl(228 47% 22%)" }}
              />
              <Button
                className="w-full h-12 font-semibold"
                style={{ background: "#2B6BFF" }}
                disabled={!data.name.trim()}
                onClick={next}
              >
                Reveal My Life Score
              </Button>
            </div>
          </motion.div>
        )}

        {/* Reveal */}
        {currentStep === "reveal" && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm text-center space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-xl font-display font-semibold text-muted-foreground uppercase tracking-wider">
                {data.name}, your starting score is
              </h2>
            </div>

            {/* Score Ring */}
            <div className="relative w-52 h-52 mx-auto">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(228 47% 18%)" strokeWidth="5" />
                <motion.circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="#FF4D6D"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 45}
                  initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - initialScore / 100) }}
                  transition={{ duration: 2.5, ease: "easeOut", delay: 0.3 }}
                  style={{ filter: "drop-shadow(0 0 8px rgba(255,77,109,0.4))" }}
                />
              </svg>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute inset-0 flex flex-col items-center justify-center"
              >
                <div className="text-6xl font-display font-bold text-[#FF4D6D]">
                  <AnimatedScore target={initialScore} />
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Life Score</div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <p className="text-lg font-medium">This is your starting point.</p>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                  Based on your answers, LifePath has calibrated three science modules for you. Every action you take will move this number.
                </p>
              </div>

              <div className="p-4 rounded-xl text-left text-sm text-muted-foreground" style={{ background: "rgba(43,107,255,0.06)", border: "1px solid rgba(43,107,255,0.2)" }}>
                <div className="font-semibold text-foreground mb-2">Your goal: <span className="text-primary">"{data.changeStatement}"</span></div>
                <p className="text-xs">This will be your anchor throughout LifePath. When resistance comes, return to this.</p>
              </div>

              <Button
                size="lg"
                className="w-full h-14 text-base font-semibold rounded-2xl"
                style={{ background: "#2B6BFF" }}
                onClick={handleComplete}
                disabled={completeMutation.isPending}
              >
                {completeMutation.isPending ? "Setting up your system..." : "Enter LifePath →"}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
