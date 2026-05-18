import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCompleteOnboarding } from "@workspace/api-client-react";

const STEPS = [
  "intro",
  "struggle",
  "duration",
  "history",
  "impact",
  "name",
  "reveal"
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [stepIndex, setStepIndex] = useState(0);
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

  const next = () => setStepIndex(i => Math.min(i + 1, STEPS.length - 1));

  const handleComplete = () => {
    completeMutation.mutate({
      data: {
        name: data.name,
        biggestStruggle: data.biggestStruggle as any,
        struggleDuration: data.struggleDuration as any,
        triedBefore: data.triedBefore as any,
        changeStatement: data.changeStatement,
        addictionType: data.biggestStruggle === "compulsive_habits" ? "social_media" : undefined
      }
    }, {
      onSuccess: () => {
        localStorage.setItem("lifepath_onboarded", "true");
        setLocation("/dashboard");
      }
    });
  };

  const currentStep = STEPS[stepIndex];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <AnimatePresence mode="wait">
        {currentStep === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-xl text-center space-y-8"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight">
              Most apps treat symptoms.<br/>
              <span className="text-primary">LifePath treats you.</span>
            </h1>
            <Button size="lg" className="px-8" onClick={next} data-testid="btn-begin">
              Begin
            </Button>
          </motion.div>
        )}

        {currentStep === "struggle" && (
          <motion.div
            key="struggle"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md space-y-6"
          >
            <h2 className="text-2xl font-display font-semibold">What is your single biggest invisible struggle?</h2>
            <div className="space-y-3">
              {[
                { id: "procrastination", label: "Procrastination" },
                { id: "compulsive_habits", label: "Compulsive habits" },
                { id: "cant_focus", label: "Can't focus" },
                { id: "all_of_the_above", label: "All of the above" }
              ].map(opt => (
                <button
                  key={opt.id}
                  className="w-full p-4 text-left rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-white/5 transition-all"
                  onClick={() => { setData(d => ({ ...d, biggestStruggle: opt.id })); next(); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {currentStep === "duration" && (
          <motion.div
            key="duration"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md space-y-6"
          >
            <h2 className="text-2xl font-display font-semibold">How long has this been affecting your life?</h2>
            <div className="space-y-3">
              {[
                { id: "weeks", label: "Weeks" },
                { id: "months", label: "Months" },
                { id: "years", label: "Years" }
              ].map(opt => (
                <button
                  key={opt.id}
                  className="w-full p-4 text-left rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-white/5 transition-all"
                  onClick={() => { setData(d => ({ ...d, struggleDuration: opt.id })); next(); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {currentStep === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md space-y-6"
          >
            <h2 className="text-2xl font-display font-semibold">Have you tried to fix it before?</h2>
            <div className="space-y-3">
              {[
                { id: "yes_nothing_worked", label: "Yes, nothing worked" },
                { id: "yes_briefly", label: "Yes, briefly" },
                { id: "no_first_time", label: "No, first time" }
              ].map(opt => (
                <button
                  key={opt.id}
                  className="w-full p-4 text-left rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-white/5 transition-all"
                  onClick={() => { setData(d => ({ ...d, triedBefore: opt.id })); next(); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {currentStep === "impact" && (
          <motion.div
            key="impact"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md space-y-6"
          >
            <h2 className="text-2xl font-display font-semibold">What would fixing this change in your life?</h2>
            <div className="space-y-4">
              <Input 
                autoFocus
                placeholder="I could finally start my business..."
                value={data.changeStatement}
                onChange={e => setData(d => ({ ...d, changeStatement: e.target.value.slice(0, 120) }))}
                className="bg-card h-14 text-lg border-border"
              />
              <Button 
                className="w-full h-12" 
                disabled={!data.changeStatement}
                onClick={next}
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {currentStep === "name" && (
          <motion.div
            key="name"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-md space-y-6"
          >
            <h2 className="text-2xl font-display font-semibold">What is your name?</h2>
            <div className="space-y-4">
              <Input 
                autoFocus
                placeholder="Your name"
                value={data.name}
                onChange={e => setData(d => ({ ...d, name: e.target.value }))}
                className="bg-card h-14 text-lg border-border"
              />
              <Button 
                className="w-full h-12" 
                disabled={!data.name}
                onClick={next}
              >
                Reveal Life Score
              </Button>
            </div>
          </motion.div>
        )}

        {currentStep === "reveal" && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md text-center space-y-8"
          >
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
              <motion.svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
                <motion.circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth="6"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 0.42 }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  className="origin-center -rotate-90"
                />
              </motion.svg>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 1 }}
                className="text-5xl font-display font-bold text-white"
              >
                42
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-display font-semibold">
                {data.name}, your Life Score is 42.
              </h2>
              <p className="text-muted-foreground text-lg">
                Here's exactly how we fix it.
              </p>
              
              <Button 
                size="lg" 
                className="w-full"
                onClick={handleComplete}
                disabled={completeMutation.isPending}
              >
                {completeMutation.isPending ? "Setting up..." : "Enter LifePath"}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
