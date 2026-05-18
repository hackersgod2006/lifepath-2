import { useState, useEffect, useRef } from "react";
import {
  useGetRooms, useGetSessionStats, useStartSession, useCompleteSession,
  useJoinRoom, useLeaveRoom, getGetRoomsQueryKey, getGetSessionStatsQueryKey,
  SessionInputDurationMinutes
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Clock, Play, Pause, Square, BookOpen, Brain,
  Zap, CheckCircle, ChevronDown, ChevronUp, Target, Volume2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

const SCIENCE_CARDS = [
  {
    icon: "👥",
    title: "Social Facilitation (Zajonc, 1965)",
    body: "Robert Zajonc's landmark Science study proved that the mere presence of others improves performance on well-learned tasks by up to 37%. The mechanism: mild physiological arousal enhances dominant (practiced) responses. Virtual presence triggers the same effect via autonomic nervous system activation.",
    color: "#2B6BFF"
  },
  {
    icon: "🌊",
    title: "Flow States (Csikszentmihalyi, 1990)",
    body: "Mihaly Csikszentmihalyi identified 9 components of flow. Body doubling artificially satisfies 'clarity of goals' and 'sense of personal control' — two of the hardest to achieve alone — which is why focus rooms dramatically increase the probability of entering flow within 12 minutes.",
    color: "#00C8FF"
  },
  {
    icon: "⏱️",
    title: "Pomodoro Technique (Cirillo, 1992)",
    body: "Francesco Cirillo's technique leverages the brain's ultradian rhythms — 25-minute focused work followed by 5-minute rest matches the natural attention oscillation cycle. Research shows task switching during Pomodoros reduces session productivity by 23% due to attention residue (Leroy, 2009).",
    color: "#A78BFA"
  },
  {
    icon: "🧘",
    title: "Co-Regulation (Porges, 2011)",
    body: "Stephen Porges' Polyvagal Theory shows that shared presence (even virtual) activates the ventral vagal complex — the 'social engagement system' — which downregulates threat response. Body doubling literally calms your nervous system, making sustained focus physiologically easier.",
    color: "#00E5A0"
  }
];

const DURATIONS: { label: string; value: SessionInputDurationMinutes; name: string; desc: string }[] = [
  { label: "25 min", value: 25, name: "Pomodoro", desc: "Classic Cirillo focus block" },
  { label: "50 min", value: 50, name: "Deep Work", desc: "Cal Newport's minimum deep work unit" },
  { label: "90 min", value: 90, name: "Flow Session", desc: "Csikszentmihalyi's optimal duration" },
];

function PomodoroTimer({
  duration,
  onComplete,
  onCancel,
  roomName,
  intention
}: {
  duration: number;
  onComplete: (quality: number) => void;
  onCancel: () => void;
  roomName: string;
  intention: string;
}) {
  const totalSeconds = duration * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [qualityRating, setQualityRating] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPaused || isComplete) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setIsComplete(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPaused, isComplete]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = (totalSeconds - secondsLeft) / totalSeconds;
  const circumference = 2 * Math.PI * 54;

  if (isComplete && qualityRating === null) {
    return (
      <div className="flex flex-col items-center py-10 px-6 text-center space-y-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
          <CheckCircle className="w-20 h-20 text-[#00E5A0] mx-auto" />
        </motion.div>
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-bold">Session Complete</h2>
          <p className="text-muted-foreground">{duration} minutes of focused work done.</p>
        </div>
        <div className="space-y-4 w-full max-w-xs">
          <p className="text-sm font-semibold">How was your focus quality?</p>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map(q => (
              <motion.button
                key={q}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { setQualityRating(q); onComplete(q); }}
                className="aspect-square rounded-xl text-xl font-bold flex items-center justify-center"
                style={{ background: "hsl(228 44% 18%)", border: "1px solid hsl(228 47% 25%)" }}
              >
                {q}
              </motion.button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">1 = scattered · 5 = deep flow</p>
        </div>
      </div>
    );
  }

  if (qualityRating !== null) {
    return (
      <div className="flex flex-col items-center py-10 text-center space-y-4">
        <div className="text-5xl">🎯</div>
        <h2 className="text-xl font-display font-bold">Logged</h2>
        <p className="text-sm text-muted-foreground">Quality {qualityRating}/5 recorded. Your Life Score updated.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-6 px-6 space-y-8">
      <div className="text-center">
        <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{roomName}</div>
        {intention && <div className="text-sm text-primary mt-1">"{intention}"</div>}
      </div>

      {/* Timer Ring */}
      <div className="relative w-52 h-52">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(228 47% 18%)" strokeWidth="6" />
          <motion.circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="#2B6BFF"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{ filter: "drop-shadow(0 0 8px rgba(43,107,255,0.5))" }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-display font-bold font-mono">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{isPaused ? "Paused" : "Focusing"}</div>
        </div>
      </div>

      {/* Pulsing presence indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <motion.div
          className="w-2 h-2 rounded-full bg-[#00E5A0]"
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        Your presence is anchoring your focus
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setIsPaused(p => !p)}
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: "rgba(43,107,255,0.15)", border: "1px solid rgba(43,107,255,0.3)" }}
        >
          {isPaused ? <Play className="w-6 h-6 text-primary ml-0.5" /> : <Pause className="w-6 h-6 text-primary" />}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={onCancel}
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.2)" }}
        >
          <Square className="w-5 h-5 text-[#FF4D6D]" />
        </motion.button>
      </div>

      <div className="p-4 rounded-xl text-sm text-center text-muted-foreground w-full" style={{ background: "rgba(43,107,255,0.06)" }}>
        Zajonc (1965): Your focus is amplified by the presence of others in this room. Don't break the session — attention residue degrades performance for up to 20 min.
      </div>
    </div>
  );
}

export default function BodyDoubling() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: rooms, isLoading: roomsLoading } = useGetRooms();
  const { data: stats, isLoading: statsLoading } = useGetSessionStats();
  const startSession = useStartSession();
  const completeSession = useCompleteSession();
  const joinRoom = useJoinRoom();
  const leaveRoom = useLeaveRoom();

  const [activeSession, setActiveSession] = useState<{
    sessionId: number; roomId: number; roomName: string; duration: number; intention: string;
  } | null>(null);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<SessionInputDurationMinutes>(25);
  const [intention, setIntention] = useState("");
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [expandedScience, setExpandedScience] = useState<number | null>(null);

  const handleJoinRoom = (room: any) => {
    setSelectedRoom(room);
    setIsSetupOpen(true);
  };

  const handleStartSession = () => {
    if (!selectedRoom) return;
    joinRoom.mutate({ id: selectedRoom.id, data: { intention: intention || "Focus session", durationMinutes: selectedDuration } });
    startSession.mutate(
      { data: { roomId: selectedRoom.id, durationMinutes: selectedDuration, intention: intention || "Focus session" } },
      {
        onSuccess: (data) => {
          setActiveSession({
            sessionId: data.id,
            roomId: selectedRoom.id,
            roomName: selectedRoom.name,
            duration: selectedDuration,
            intention: intention || ""
          });
          setIsSetupOpen(false);
          setIsTimerOpen(true);
          setIntention("");
          toast({ title: "Session started", description: `${selectedDuration}-min focus block with ${selectedRoom.presenceCount + 1} people in the room.` });
        }
      }
    );
  };

  const handleCompleteSession = (quality: number) => {
    if (!activeSession) return;
    completeSession.mutate(
      { id: activeSession.sessionId, data: { taskCompleted: false, focusQuality: quality } },
      {
        onSuccess: () => {
          leaveRoom.mutate({ id: activeSession.roomId });
          queryClient.invalidateQueries({ queryKey: getGetSessionStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRoomsQueryKey() });
          setTimeout(() => {
            setIsTimerOpen(false);
            setActiveSession(null);
            toast({
              title: "Session complete",
              description: `${activeSession.duration} minutes logged. Focus quality: ${quality}/5.`
            });
          }, 2000);
        }
      }
    );
  };

  const handleCancelSession = () => {
    if (activeSession) {
      leaveRoom.mutate({ id: activeSession.roomId });
    }
    setIsTimerOpen(false);
    setActiveSession(null);
  };

  if (roomsLoading || statsLoading) {
    return <div className="p-6 space-y-4"><Skeleton className="h-40 w-full rounded-2xl bg-card" /><Skeleton className="h-64 w-full rounded-2xl bg-card" /></div>;
  }

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto space-y-8 pb-28">
      {/* Timer Sheet */}
      <Sheet open={isTimerOpen} onOpenChange={(open) => { if (!open) handleCancelSession(); }}>
        <SheetContent side="bottom" className="h-[92vh] rounded-t-3xl overflow-y-auto" style={{ background: "hsl(228 44% 10%)", border: "none" }}>
          {activeSession && (
            <PomodoroTimer
              duration={activeSession.duration}
              roomName={activeSession.roomName}
              intention={activeSession.intention}
              onComplete={handleCompleteSession}
              onCancel={handleCancelSession}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Setup Sheet */}
      <Sheet open={isSetupOpen} onOpenChange={setIsSetupOpen}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl overflow-y-auto" style={{ background: "hsl(228 44% 10%)", border: "none" }}>
          <SheetHeader>
            <SheetTitle className="font-display">{selectedRoom?.name}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6 pb-10">
            {/* Science context */}
            <div className="p-4 rounded-xl text-sm text-muted-foreground" style={{ background: "rgba(43,107,255,0.06)", border: "1px solid rgba(43,107,255,0.15)" }}>
              <span className="text-primary font-semibold">{(selectedRoom?.presenceCount ?? 0) + 1} people</span> will be focusing alongside you. Zajonc (1965) showed this presence alone improves performance on practiced tasks by up to 37%.
            </div>

            {/* Duration Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Session Duration</label>
              <div className="space-y-2">
                {DURATIONS.map(d => (
                  <motion.button
                    key={d.value}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedDuration(d.value)}
                    className="w-full p-4 rounded-xl text-left flex justify-between items-center"
                    style={{
                      background: selectedDuration === d.value ? "rgba(43,107,255,0.12)" : "hsl(228 44% 15%)",
                      border: selectedDuration === d.value ? "1px solid #2B6BFF" : "1px solid hsl(228 47% 22%)"
                    }}
                  >
                    <div>
                      <div className="font-semibold">{d.label} <span className="text-sm text-muted-foreground">— {d.name}</span></div>
                      <div className="text-xs text-muted-foreground">{d.desc}</div>
                    </div>
                    {selectedDuration === d.value && <CheckCircle className="w-5 h-5 text-primary" />}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Intention */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Session Intention</label>
                <span className="text-xs text-[#00C8FF] px-2 py-0.5 rounded-full" style={{ background: "rgba(0,200,255,0.1)" }}>Gollwitzer, 1999</span>
              </div>
              <Input
                placeholder="What will you work on specifically?"
                value={intention}
                onChange={e => setIntention(e.target.value)}
                style={{ background: "hsl(228 44% 15%)", border: "1px solid hsl(228 47% 22%)" }}
              />
              <p className="text-xs text-muted-foreground">Specifying your intention activates implementation intentions — increases follow-through by 91%.</p>
            </div>

            <Button
              className="w-full h-12 text-base font-semibold"
              style={{ background: "#2B6BFF" }}
              onClick={handleStartSession}
              disabled={startSession.isPending}
            >
              <Play className="w-5 h-5 mr-2" />
              {startSession.isPending ? "Starting..." : "Start Session"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Header */}
      <div className="pt-2">
        <h1 className="text-3xl font-display font-bold tracking-tight">Body Doubling</h1>
        <p className="text-muted-foreground text-sm mt-1">Social Facilitation · Flow Theory · Polyvagal Co-Regulation</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Focus This Week", value: `${stats.totalHoursThisWeek}h`, color: "#2B6BFF" },
            { label: "Sessions", value: stats.totalSessionsThisWeek, color: "#00C8FF" },
            { label: "Avg Quality", value: `${stats.averageFocusQuality ?? 0}/5`, color: "#00E5A0" },
            { label: "Best Streak", value: `${stats.bestStreak ?? 0}d`, color: "#A78BFA" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-4 rounded-2xl text-center"
              style={{ background: "hsl(228 44% 13%)", border: `1px solid ${s.color}20` }}
            >
              <div className="text-2xl font-display font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Rooms */}
      <div className="space-y-4">
        <h2 className="font-display font-bold text-xl">Active Focus Rooms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rooms?.map((room, i) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="p-5 rounded-2xl flex items-center justify-between cursor-pointer group"
              style={{ background: "hsl(228 44% 13%)", border: "1px solid hsl(228 47% 18%)" }}
              whileHover={{ borderColor: "rgba(43,107,255,0.4)", y: -2 }}
              onClick={() => handleJoinRoom(room)}
            >
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{room.name}</h3>
                <div className="flex items-center gap-3">
                  {/* Presence dots */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(room.presenceCount, 8) }).map((_, j) => (
                      <motion.div
                        key={j}
                        className="w-2 h-2 rounded-full bg-[#00E5A0]"
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ repeat: Infinity, duration: 2, delay: j * 0.3 }}
                      />
                    ))}
                    {room.presenceCount > 8 && <span className="text-xs text-muted-foreground">+{room.presenceCount - 8}</span>}
                  </div>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {room.presenceCount} focusing
                  </span>
                </div>
              </div>
              <motion.div
                className="w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "rgba(43,107,255,0.15)", border: "1px solid rgba(43,107,255,0.3)" }}
                whileHover={{ scale: 1.1 }}
              >
                <Play className="w-5 h-5 text-primary ml-0.5" />
              </motion.div>
            </motion.div>
          ))}
          {!rooms?.length && (
            <div className="col-span-2 p-10 text-center rounded-2xl" style={{ background: "hsl(228 44% 13%)", border: "1px solid hsl(228 47% 18%)" }}>
              <p className="text-muted-foreground">No active rooms right now.</p>
            </div>
          )}
        </div>
      </div>

      {/* Science Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">The Neuroscience</h2>
        </div>
        <div className="space-y-2">
          {SCIENCE_CARDS.map((card, i) => {
            const isExpanded = expandedScience === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl overflow-hidden cursor-pointer"
                style={{ border: `1px solid ${card.color}20`, background: `${card.color}05` }}
                onClick={() => setExpandedScience(isExpanded ? null : i)}
              >
                <div className="p-4 flex items-center gap-3">
                  <span className="text-xl">{card.icon}</span>
                  <span className="font-semibold text-sm flex-1">{card.title}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
                <AnimatePresence>
                  {isExpanded && (
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
