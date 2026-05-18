import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetMe, useUpdateMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { useLocation } from "wouter";
import { LogOut, User, Brain, Activity, Users, RefreshCw, CheckCircle, Shield, Bell } from "lucide-react";

const STRUGGLE_OPTIONS = [
  {
    value: "procrastination",
    label: "Procrastination",
    icon: Brain,
    color: "#2B6BFF",
    science: "Temporal Motivation Theory (Steel, 2007)",
    desc: "Struggling to start or complete tasks despite intentions",
  },
  {
    value: "compulsive_habits",
    label: "Addiction & Compulsive Habits",
    icon: Activity,
    color: "#F8A72A",
    science: "Dopamine Seesaw (Lembke, 2021)",
    desc: "Breaking patterns of compulsive digital or substance use",
  },
  {
    value: "cant_focus",
    label: "Focus & Concentration",
    icon: Users,
    color: "#A78BFA",
    science: "Social Facilitation Theory (Zajonc, 1965)",
    desc: "Difficulty sustaining attention on meaningful work",
  },
  {
    value: "all_of_the_above",
    label: "All of the Above",
    icon: CheckCircle,
    color: "#00E5A0",
    science: "Integrated Life Score system",
    desc: "Working on multiple areas simultaneously",
  },
];

const ADDICTION_TYPES = [
  { value: "social_media", label: "Social Media" },
  { value: "pornography", label: "Pornography" },
  { value: "gambling", label: "Gambling" },
  { value: "substances", label: "Substances" },
  { value: "compulsive_eating", label: "Compulsive Eating" },
];

export default function Settings() {
  const { data: user, isLoading } = useGetMe();
  const updateMe = useUpdateMe();
  const { toast } = useToast();
  const { logout, updateUser } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [showModulePicker, setShowModulePicker] = useState(false);
  const [selectedStruggle, setSelectedStruggle] = useState("");
  const [selectedAddiction, setSelectedAddiction] = useState("");
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Initialize form from loaded user
  const initialized = useState(false);
  if (user && !initialized[0]) {
    initialized[1](true);
    setName(user.name ?? "");
    setSelectedStruggle(user.biggestStruggle ?? "");
    setSelectedAddiction(user.addictionType ?? "");
  }

  const handleSave = () => {
    updateMe.mutate(
      { data: { name } },
      {
        onSuccess: (updated) => {
          updateUser({ name: updated.name });
          toast({ title: "Profile saved", description: "Your changes have been applied." });
        },
      }
    );
  };

  const handleModuleSwitch = () => {
    if (!selectedStruggle) return;
    const activeModules = ["procrastination", "body_doubling"];
    if (selectedStruggle === "compulsive_habits" || selectedStruggle === "all_of_the_above") {
      activeModules.push("addiction");
    }
    updateMe.mutate(
      {
        data: {
          biggestStruggle: selectedStruggle as any,
          activeModules,
          addictionType: (selectedStruggle === "compulsive_habits" || selectedStruggle === "all_of_the_above")
            ? selectedAddiction || "social_media"
            : undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries();
          setShowModulePicker(false);
          toast({ title: "Focus updated", description: "Your modules have been reconfigured." });
        },
      }
    );
  };

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
      </div>
    );
  }

  const currentStruggle = STRUGGLE_OPTIONS.find(s => s.value === (user?.biggestStruggle ?? ""));

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 pb-24">
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your profile and focus areas</p>
      </div>

      {/* Profile */}
      <section className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <User className="w-4 h-4" style={{ color: "#2B6BFF" }} />
          <h2 className="font-semibold text-white">Profile</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Display Name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-12 bg-white/5 border-white/10 text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <Input
              value={(user as any)?.email ?? "—"}
              disabled
              className="h-12 bg-white/5 border-white/10 text-muted-foreground opacity-60"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed after signup</p>
          </div>
          <Button onClick={handleSave} disabled={updateMe.isPending} className="gap-2" style={{ background: "#2B6BFF" }}>
            {updateMe.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </section>

      {/* Change Focus Module */}
      <section className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <RefreshCw className="w-4 h-4" style={{ color: "#00C8FF" }} />
          <h2 className="font-semibold text-white">Change My Focus</h2>
        </div>
        <div className="p-6 space-y-4">
          {currentStruggle && !showModulePicker && (
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: `${currentStruggle.color}10`, border: `1px solid ${currentStruggle.color}25` }}>
              <currentStruggle.icon className="w-5 h-5 flex-shrink-0" style={{ color: currentStruggle.color }} />
              <div>
                <p className="text-white font-medium">{currentStruggle.label}</p>
                <p className="text-xs text-muted-foreground">{currentStruggle.science}</p>
              </div>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Life circumstances change. Update your primary focus anytime and LifePath will reconfigure your modules and science approach.
          </p>
          <Button
            onClick={() => setShowModulePicker(v => !v)}
            variant="outline"
            className="gap-2 border-white/10 text-white hover:bg-white/5"
          >
            <RefreshCw className="w-4 h-4" />
            {showModulePicker ? "Cancel" : "Change My Focus"}
          </Button>

          <AnimatePresence>
            {showModulePicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                <div className="grid gap-3">
                  {STRUGGLE_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    const isSelected = selectedStruggle === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedStruggle(opt.value)}
                        className="flex items-start gap-4 p-4 rounded-xl text-left transition-all"
                        style={{
                          background: isSelected ? `${opt.color}12` : "rgba(255,255,255,0.03)",
                          border: `1px solid ${isSelected ? opt.color + "40" : "rgba(255,255,255,0.07)"}`,
                        }}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${opt.color}20` }}>
                          <Icon className="w-4 h-4" style={{ color: opt.color }} />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{opt.label}</p>
                          <p className="text-xs text-muted-foreground">{opt.desc}</p>
                          <p className="text-xs mt-1" style={{ color: opt.color }}>{opt.science}</p>
                        </div>
                        {isSelected && <CheckCircle className="w-4 h-4 ml-auto flex-shrink-0 mt-1" style={{ color: opt.color }} />}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {(selectedStruggle === "compulsive_habits" || selectedStruggle === "all_of_the_above") && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">What is your primary addiction?</p>
                      <div className="flex flex-wrap gap-2">
                        {ADDICTION_TYPES.map(a => (
                          <button
                            key={a.value}
                            onClick={() => setSelectedAddiction(a.value)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{
                              background: selectedAddiction === a.value ? "rgba(248,167,42,0.2)" : "rgba(255,255,255,0.05)",
                              border: `1px solid ${selectedAddiction === a.value ? "#F8A72A" : "rgba(255,255,255,0.1)"}`,
                              color: selectedAddiction === a.value ? "#F8A72A" : "hsl(220 20% 58%)",
                            }}
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  onClick={handleModuleSwitch}
                  disabled={!selectedStruggle || updateMe.isPending}
                  className="gap-2"
                  style={{ background: "linear-gradient(135deg, #2B6BFF, #00C8FF)" }}
                >
                  <CheckCircle className="w-4 h-4" />
                  {updateMe.isPending ? "Updating..." : "Apply New Focus"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Science & Privacy */}
      <section className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <Shield className="w-4 h-4" style={{ color: "#00E5A0" }} />
          <h2 className="font-semibold text-white">About LifePath 2.0</h2>
        </div>
        <div className="p-6 space-y-3 text-sm text-muted-foreground">
          <p>All science in this app is sourced from peer-reviewed publications. No pseudoscience, no motivational platitudes.</p>
          <p>Your data is private and stored only in your personal account.</p>
          <div className="pt-2 space-y-1 text-xs opacity-70">
            <p>• Temporal Motivation Theory — Psychological Bulletin, 2007</p>
            <p>• Implementation Intentions — American Psychologist, 1999</p>
            <p>• Dopamine Nation — Anna Lembke, Stanford Psychiatry, 2021</p>
            <p>• ACT & Urge Surfing — Steven Hayes, University of Nevada</p>
            <p>• Social Facilitation — Robert Zajonc, Science, 1965</p>
            <p>• Flow Theory — Mihaly Csikszentmihalyi, University of Chicago</p>
          </div>
          <p className="pt-2 text-xs opacity-60 font-medium">Founded by Muslim Abubakar Toro</p>
        </div>
      </section>

      {/* Logout */}
      <section className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(239,68,68,0.15)" }}>
        <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: "rgba(239,68,68,0.1)" }}>
          <LogOut className="w-4 h-4 text-red-400" />
          <h2 className="font-semibold text-white">Sign Out</h2>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-muted-foreground">Your progress is saved. You can sign back in anytime with your email and password.</p>
          {!confirmLogout ? (
            <Button variant="outline" onClick={() => setConfirmLogout(true)} className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button onClick={handleLogout} className="gap-2 bg-red-500 hover:bg-red-600 text-white">
                <LogOut className="w-4 h-4" /> Yes, Sign Out
              </Button>
              <Button variant="ghost" onClick={() => setConfirmLogout(false)}>Cancel</Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
