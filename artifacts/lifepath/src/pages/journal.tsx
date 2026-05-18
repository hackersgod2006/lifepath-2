import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Send, Trash2, ChevronDown, ChevronUp, Lightbulb, Smile, Meh, Frown, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";

interface JournalEntry {
  id: number;
  prompt: string;
  content: string;
  module: string;
  mood: string | null;
  date: string;
  createdAt: string;
}

interface TodayPrompt {
  prompt: string;
  module: string;
  alreadyJournaledToday: boolean;
  date: string;
}

const MOODS = [
  { value: "great", label: "Great", icon: Heart, color: "#00E5A0" },
  { value: "good", label: "Good", icon: Smile, color: "#2B6BFF" },
  { value: "okay", label: "Okay", icon: Meh, color: "#F8A72A" },
  { value: "low", label: "Low", icon: Frown, color: "#EF4444" },
];

const MODULE_COLORS: Record<string, string> = {
  procrastination: "#2B6BFF",
  compulsive_habits: "#F8A72A",
  cant_focus: "#A78BFA",
  general: "#00C8FF",
};

const MODULE_LABELS: Record<string, string> = {
  procrastination: "Procrastination",
  compulsive_habits: "Recovery",
  cant_focus: "Focus",
  general: "General",
};

export default function Journal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [todayPrompt, setTodayPrompt] = useState<TodayPrompt | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [content, setContent] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setWordCount(content.trim() ? content.trim().split(/\s+/).length : 0);
  }, [content]);

  async function loadData() {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("lifepath_token") ?? "";
      const [promptRes, entriesRes] = await Promise.all([
        fetch("/api/journal/prompt", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/journal", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (promptRes.ok) setTodayPrompt(await promptRes.json());
      if (entriesRes.ok) setEntries(await entriesRes.json());
    } catch {
      //
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit() {
    if (!todayPrompt || content.trim().length < 10) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem("lifepath_token") ?? "";
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          prompt: todayPrompt.prompt,
          content: content.trim(),
          module: todayPrompt.module,
          mood: selectedMood || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const entry = await res.json();
      setEntries(prev => [entry, ...prev]);
      setContent("");
      setSelectedMood("");
      setTodayPrompt(prev => prev ? { ...prev, alreadyJournaledToday: true } : prev);
      toast({ title: "Journal entry saved", description: "Keep building the habit — consistency is the secret." });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      const token = localStorage.getItem("lifepath_token") ?? "";
      await fetch(`/api/journal/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setEntries(prev => prev.filter(e => e.id !== id));
      toast({ title: "Entry deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  }

  const moduleColor = todayPrompt ? (MODULE_COLORS[todayPrompt.module] ?? "#00C8FF") : "#2B6BFF";
  const isReady = content.trim().length >= 10;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-white">Science Journal</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Expressive writing reduces distress by 23% and improves follow-through.
          <span className="opacity-60 ml-1">— Pennebaker & Smyth, 2016</span>
        </p>
      </div>

      {/* Today's entry card */}
      {isLoading ? (
        <Skeleton className="h-80 w-full rounded-2xl" />
      ) : todayPrompt && !todayPrompt.alreadyJournaledToday ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden"
          style={{ border: `1px solid ${moduleColor}30` }}
        >
          {/* Prompt header */}
          <div className="p-6 pb-4" style={{ background: `${moduleColor}10` }}>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4" style={{ color: moduleColor }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: moduleColor }}>
                {MODULE_LABELS[todayPrompt.module] ?? "Today's"} Prompt
              </span>
            </div>
            <p className="text-white font-medium leading-relaxed">{todayPrompt.prompt}</p>
          </div>

          <div className="p-6 space-y-5" style={{ background: "rgba(255,255,255,0.02)" }}>
            {/* Mood */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">How are you feeling?</p>
              <div className="flex gap-2">
                {MOODS.map(m => {
                  const Icon = m.icon;
                  const active = selectedMood === m.value;
                  return (
                    <button
                      key={m.value}
                      onClick={() => setSelectedMood(active ? "" : m.value)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: active ? `${m.color}20` : "rgba(255,255,255,0.05)",
                        border: `1px solid ${active ? m.color : "transparent"}`,
                        color: active ? m.color : "hsl(220 20% 58%)",
                      }}
                    >
                      <Icon className="w-4 h-4" />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write freely — no one else will read this. Honesty helps the science work..."
                rows={6}
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted-foreground resize-none outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onFocus={e => { e.target.style.borderColor = moduleColor; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
              />
              <div className="absolute bottom-3 right-3 text-xs text-muted-foreground opacity-60">
                {wordCount} {wordCount === 1 ? "word" : "words"}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {content.length < 10 ? `${10 - content.trim().length} more chars needed` : "Ready to save"}
              </p>
              <Button
                onClick={handleSubmit}
                disabled={!isReady || isSaving}
                className="gap-2"
                style={{ background: isReady ? `linear-gradient(135deg, ${moduleColor}, #00C8FF)` : undefined }}
              >
                <Send className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Entry"}
              </Button>
            </div>
          </div>
        </motion.div>
      ) : todayPrompt?.alreadyJournaledToday ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl p-6 text-center space-y-3"
          style={{ background: "rgba(0,229,160,0.06)", border: "1px solid rgba(0,229,160,0.2)" }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(0,229,160,0.15)" }}>
            <BookOpen className="w-6 h-6" style={{ color: "#00E5A0" }} />
          </div>
          <p className="text-white font-semibold">Today's entry is written</p>
          <p className="text-muted-foreground text-sm">Come back tomorrow for a new prompt. Consistent journaling compounds like interest.</p>
        </motion.div>
      ) : null}

      {/* Past entries */}
      <div className="space-y-4">
        <h2 className="text-lg font-display font-semibold text-white">Past Entries</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <BookOpen className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground text-sm">No entries yet. Write your first one above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {entries.map(entry => {
                const color = MODULE_COLORS[entry.module] ?? "#00C8FF";
                const isExpanded = expandedEntry === entry.id;
                const entryMood = MOODS.find(m => m.value === entry.mood);
                return (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="rounded-xl overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <button
                      className="w-full px-5 py-4 flex items-center gap-3 text-left"
                      onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                    >
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs" style={{ color }}>{MODULE_LABELS[entry.module] ?? entry.module}</span>
                          {entryMood && (
                            <span className="text-xs" style={{ color: entryMood.color }}>{entryMood.label}</span>
                          )}
                        </div>
                        <p className="text-sm text-white truncate">{entry.prompt}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{new Date(entry.createdAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-4 space-y-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                            <p className="text-sm text-muted-foreground pt-3 italic">"{entry.prompt}"</p>
                            <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                            <div className="flex justify-end">
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
