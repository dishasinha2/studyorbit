"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Coffee,
  Flame,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Sparkles,
  Target,
  Timer as TimerIcon,
  Trash2,
  Zap,
} from "lucide-react";
import { getFirebaseIdToken, readStoredSession } from "@/lib/firebase-client";

type FocusSessionItem = {
  id: string;
  durationMin: number;
  breakMin: number;
  note?: string | null;
  startedAt: string;
  endedAt?: string | null;
  createdAt: string;
};

type TimerMode = "pomodoro" | "shortBreak" | "longBreak" | "custom";

type StoredTimer = {
  timerMode: TimerMode;
  customFocusMin: number;
  customBreakMin: number;
  sessionNote: string;
  totalSeconds: number;
  timeRemaining: number;
  isRunning: boolean;
  sessionStartedAt: string | null;
  savedAt: number;
};

const TIMER_STORAGE_KEY = "studyorbit.focus-timer";

export function FocusPanel() {
  // Stats state
  const [sessions, setSessions] = useState<FocusSessionItem[]>([]);
  const [usedMinutes, setUsedMinutes] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  // Timer configuration state
  const [timerMode, setTimerMode] = useState<TimerMode>("pomodoro");
  const [customFocusMin, setCustomFocusMin] = useState(45);
  const [customBreakMin, setCustomBreakMin] = useState(10);
  const [sessionNote, setSessionNote] = useState("");

  // Countdown runtime state
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(25 * 60); // in seconds
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [sessionStartedAt, setSessionStartedAt] = useState<Date | null>(null);
  const [timerHydrated, setTimerHydrated] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sessionRecordedRef = useRef(false);

  // Keep a running timer alive across navigation. Wall-clock time is used on
  // restore, so the countdown remains accurate even while this page is closed.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) {
        const timer = JSON.parse(saved) as StoredTimer;
        const elapsedWhileAway = timer.isRunning ? Math.floor((Date.now() - timer.savedAt) / 1000) : 0;
        setTimerMode(timer.timerMode);
        setCustomFocusMin(timer.customFocusMin);
        setCustomBreakMin(timer.customBreakMin);
        setSessionNote(timer.sessionNote);
        setTotalSeconds(timer.totalSeconds);
        const remaining = Math.max(0, timer.timeRemaining - elapsedWhileAway);
        setTimeRemaining(remaining);
        // Never create a session merely because the app was reopened after a
        // timer elapsed. A focus record is only created by an active timer or
        // an explicit "Complete & Record" action in the current session.
        setIsRunning(timer.isRunning && remaining > 0);
        setSessionStartedAt(timer.sessionStartedAt ? new Date(timer.sessionStartedAt) : null);
      }
    } catch {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    } finally {
      setTimerHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!timerHydrated) return;
    const timer: StoredTimer = {
      timerMode,
      customFocusMin,
      customBreakMin,
      sessionNote,
      totalSeconds,
      timeRemaining,
      isRunning,
      sessionStartedAt: sessionStartedAt?.toISOString() ?? null,
      savedAt: Date.now(),
    };
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timer));
  }, [timerHydrated, timerMode, customFocusMin, customBreakMin, sessionNote, totalSeconds, timeRemaining, isRunning, sessionStartedAt]);

  // Sound chime when timer finishes
  const playCompletionChime = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        void ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // Audio fallback silent
    }
  }, []);

  // Fetch today's focus stats
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const session = readStoredSession();
      const token = (await getFirebaseIdToken()) || session?.idToken;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch("/api/focus", { headers });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions ?? []);
        setUsedMinutes(data.usedMinutes ?? 0);
      }
    } catch (err) {
      console.error("Failed to load focus statistics", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const session = readStoredSession();
        const token = (await getFirebaseIdToken()) || session?.idToken;
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch("/api/focus", { headers });
        if (res.ok && alive) {
          const data = await res.json();
          setSessions(data.sessions ?? []);
          setUsedMinutes(data.usedMinutes ?? 0);
        }
      } catch (err) {
        console.error("Failed to load focus statistics", err);
      } finally {
        if (alive) setLoadingStats(false);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const refreshAtMidnight = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      const msUntilMidnight = nextMidnight.getTime() - now.getTime();

      const timeoutId = setTimeout(() => {
        void fetchStats();
      }, msUntilMidnight + 1000);

      return () => clearTimeout(timeoutId);
    };

    const cleanup = refreshAtMidnight();
    const handleVisibility = () => {
      if (!document.hidden) {
        void fetchStats();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cleanup();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchStats]);

  // Set timer preset duration when switching modes
  const applyTimerPreset = useCallback((mode: TimerMode) => {
    setIsRunning(false);
    setTimerMode(mode);
    let seconds = 25 * 60;
    if (mode === "pomodoro") seconds = 25 * 60;
    else if (mode === "shortBreak") seconds = 5 * 60;
    else if (mode === "longBreak") seconds = 15 * 60;
    else if (mode === "custom") seconds = Math.max(1, customFocusMin) * 60;

    setTimeRemaining(seconds);
    setTotalSeconds(seconds);
    setSessionStartedAt(null);
    sessionRecordedRef.current = false;
  }, [customFocusMin]);

  // Log only the time that was actually spent in the focus session.
  const handleSessionComplete = useCallback(async (completedSeconds?: number) => {
    // This guard is synchronous, so double-clicks and overlapping timer ticks
    // cannot create more than one record for the same timer run.
    if (sessionRecordedRef.current) return;

    playCompletionChime();

    let breakMin = 5;
    if (timerMode === "pomodoro") {
      breakMin = 5;
    } else if (timerMode === "shortBreak") {
      breakMin = 5;
    } else if (timerMode === "longBreak") {
      breakMin = 15;
    } else if (timerMode === "custom") {
      breakMin = customBreakMin;
    }

    const elapsedSeconds = completedSeconds ?? Math.max(0, totalSeconds - timeRemaining);
    // The database stores whole minutes. Flooring prevents a 20m session
    // from being incorrectly credited as the full 25m preset.
    const focusMin = Math.floor(elapsedSeconds / 60);

    if (focusMin > 0 && (timerMode === "pomodoro" || timerMode === "custom")) {
      sessionRecordedRef.current = true;
      try {
        const session = readStoredSession();
        const token = (await getFirebaseIdToken()) || session?.idToken;
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const now = new Date();
        const start = sessionStartedAt || new Date(now.getTime() - elapsedSeconds * 1000);

        await fetch("/api/focus", {
          method: "POST",
          headers,
          body: JSON.stringify({
            durationMin: focusMin,
            breakMin: breakMin,
            note: sessionNote.trim() || (timerMode === "pomodoro" ? "Pomodoro Session" : "Custom Focus Session"),
            startedAt: start.toISOString(),
            endedAt: now.toISOString(),
          }),
        });

        await fetchStats();
      } catch (err) {
        sessionRecordedRef.current = false;
        console.error("Failed to log focus session", err);
      }
    }
  }, [timerMode, customBreakMin, sessionNote, sessionStartedAt, totalSeconds, timeRemaining, playCompletionChime, fetchStats]);

  // Timer interval effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            void handleSessionComplete(totalSeconds);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, totalSeconds, handleSessionComplete]);

  const handleStart = () => {
    // A completed countdown can be restored from local storage at 00:00.
    // Starting it must begin a fresh timer, never record the whole preset.
    if (timeRemaining <= 0) {
      const seconds = timerMode === "pomodoro"
        ? 25 * 60
        : timerMode === "shortBreak"
          ? 5 * 60
          : timerMode === "longBreak"
            ? 15 * 60
            : Math.max(1, customFocusMin) * 60;
      setTotalSeconds(seconds);
      setTimeRemaining(seconds);
      sessionRecordedRef.current = false;
    }
    if (!sessionStartedAt || timeRemaining <= 0) {
      setSessionStartedAt(new Date());
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    applyTimerPreset(timerMode);
  };

  const deleteSession = useCallback(async (id: string) => {
    try {
      const session = readStoredSession();
      const token = (await getFirebaseIdToken()) || session?.idToken;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/focus?id=${encodeURIComponent(id)}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Failed to delete focus session");
      await fetchStats();
    } catch (err) {
      console.error("Failed to delete focus session", err);
    }
  }, [fetchStats]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progressPercent = useMemo(() => {
    if (totalSeconds <= 0) return 0;
    return Math.min(100, Math.max(0, ((totalSeconds - timeRemaining) / totalSeconds) * 100));
  }, [timeRemaining, totalSeconds]);

  const dailyTargetMin = 120;
  const targetProgress = Math.min(100, Math.round((usedMinutes / dailyTargetMin) * 100));

  return (
    <div className="focus-premium space-y-8 mx-auto">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--line)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(255,200,87,0.1)] px-3 py-1 text-xs font-semibold text-[var(--gold)] border border-[rgba(255,200,87,0.25)]">
              <TimerIcon className="h-3.5 w-3.5" /> Focus Timer
            </span>
            <span className="text-xs text-[var(--ink-dim)]">
              {usedMinutes} mins focused today
            </span>
          </div>
          <h1 className="mt-2 font-['Space_Grotesk'] text-2xl sm:text-3xl font-semibold text-[var(--ink)]">
            Focus & Productivity Hub
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 rounded-2xl border border-[var(--line)] bg-[var(--card)] px-4 py-2 backdrop-blur-md">
            <Flame className="h-4 w-4 text-[var(--gold)]" />
            <div className="text-xs">
              <p className="font-bold text-[var(--ink)]">{usedMinutes} / {dailyTargetMin} min</p>
              <p className="text-[10px] text-[var(--ink-dim)]">Daily Target</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* TIMER SECTION */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 backdrop-blur-md space-y-6">
            {/* Mode Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.03)] p-1 text-xs font-medium text-[var(--ink-dim)]">
              <button
                type="button"
                onClick={() => applyTimerPreset("pomodoro")}
                className={`rounded-lg py-2 px-2.5 transition-all flex items-center justify-center gap-1.5 ${
                  timerMode === "pomodoro"
                    ? "bg-[linear-gradient(135deg,var(--nebula),var(--nebula-soft))] text-white font-semibold shadow-[0_2px_10px_rgba(139,127,255,0.3)]"
                    : "hover:text-[var(--ink)]"
                }`}
              >
                <Zap className="h-3.5 w-3.5" /> Pomodoro
              </button>

              <button
                type="button"
                onClick={() => applyTimerPreset("shortBreak")}
                className={`rounded-lg py-2 px-2.5 transition-all flex items-center justify-center gap-1.5 ${
                  timerMode === "shortBreak"
                    ? "bg-[linear-gradient(135deg,var(--gold),#ffdc93)] text-[var(--void-deep)] font-semibold shadow-[0_2px_10px_rgba(255,200,87,0.3)]"
                    : "hover:text-[var(--ink)]"
                }`}
              >
                <Coffee className="h-3.5 w-3.5" /> Short Break
              </button>

              <button
                type="button"
                onClick={() => applyTimerPreset("longBreak")}
                className={`rounded-lg py-2 px-2.5 transition-all flex items-center justify-center gap-1.5 ${
                  timerMode === "longBreak"
                    ? "bg-[linear-gradient(135deg,var(--gold),#ffdc93)] text-[var(--void-deep)] font-semibold shadow-[0_2px_10px_rgba(255,200,87,0.3)]"
                    : "hover:text-[var(--ink)]"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" /> Long Break
              </button>

              <button
                type="button"
                onClick={() => applyTimerPreset("custom")}
                className={`rounded-lg py-2 px-2.5 transition-all flex items-center justify-center gap-1.5 ${
                  timerMode === "custom"
                    ? "bg-[linear-gradient(135deg,var(--nebula),var(--nebula-soft))] text-white font-semibold shadow-[0_2px_10px_rgba(139,127,255,0.3)]"
                    : "hover:text-[var(--ink)]"
                }`}
              >
                <Clock className="h-3.5 w-3.5" /> Custom
              </button>
            </div>

            {/* Custom Timer Input Controls */}
            {timerMode === "custom" && (
              <div className="rounded-xl border border-[rgba(255,200,87,0.25)] bg-[rgba(255,200,87,0.05)] p-4 space-y-3">
                <p className="text-xs font-bold text-[var(--gold)] flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> Configure Custom Timer
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-medium text-[var(--ink-dim)] mb-1">
                      Focus Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={240}
                      value={customFocusMin}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setCustomFocusMin(val);
                        if (timerMode === "custom" && !isRunning) {
                          setTimeRemaining(val * 60);
                          setTotalSeconds(val * 60);
                        }
                      }}
                      className="w-full rounded-lg border border-[var(--line)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm font-bold text-[var(--ink)] focus:outline-none focus:border-[var(--nebula)]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-[var(--ink-dim)] mb-1">
                      Break Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={customBreakMin}
                      onChange={(e) => setCustomBreakMin(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full rounded-lg border border-[var(--line)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm font-bold text-[var(--ink)] focus:outline-none focus:border-[var(--nebula)]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Session Note */}
            <div>
              <input
                type="text"
                placeholder="What topic are you focusing on?"
                value={sessionNote}
                onChange={(e) => setSessionNote(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-xs text-[var(--ink)] placeholder:text-[var(--ink-dim)] focus:outline-none focus:border-[var(--nebula)] transition"
              />
            </div>

            {/* Timer Clock Circle */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative flex h-56 w-56 sm:h-64 sm:w-64 items-center justify-center rounded-full border border-[var(--line)] bg-[rgba(6,8,20,0.6)] shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]">
                <svg viewBox="0 0 256 256" className="absolute inset-0 h-full w-full -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="112"
                    className="stroke-[rgba(241,239,255,0.08)]"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="128"
                    cy="128"
                    r="112"
                    className="stroke-[var(--nebula)] transition-all duration-1000 ease-linear"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 112}
                    strokeDashoffset={2 * Math.PI * 112 * (1 - progressPercent / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                <div className="text-center z-10 space-y-1">
                  <span className="font-['Space_Grotesk'] text-4xl sm:text-5xl font-bold tracking-tight text-[var(--ink)] font-mono">
                    {formatTime(timeRemaining)}
                  </span>
                  <p className="text-xs font-medium text-[var(--ink-dim)] uppercase tracking-wider">
                    {timerMode === "pomodoro"
                      ? "Pomodoro (25m)"
                      : timerMode === "shortBreak"
                      ? "Short Break (5m)"
                      : timerMode === "longBreak"
                      ? "Long Break (15m)"
                      : "Custom Timer"}
                  </p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.04)] p-3 text-[var(--ink-dim)] hover:text-[var(--ink)] transition"
                title="Reset Timer"
              >
                <RotateCcw className="h-5 w-5" />
              </button>

              {isRunning ? (
                <button
                  type="button"
                  onClick={handlePause}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.1)] px-8 py-3 text-sm font-semibold text-[var(--ink)] shadow-lg hover:bg-[rgba(255,255,255,0.15)] transition"
                >
                  <Pause className="h-5 w-5 fill-current" /> Pause
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStart}
                  className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--nebula),#6e5fe0)] px-8 py-3 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(139,127,255,0.4)] hover:shadow-[0_6px_24px_rgba(139,127,255,0.6)] transition"
                >
                  <Play className="h-5 w-5 fill-current" /> Start Focus
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsRunning(false);
                  void handleSessionComplete();
                }}
                className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.04)] p-3 text-[var(--ink-dim)] hover:text-[var(--ink)] transition"
                title="Complete & Record"
              >
                <SkipForward className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* DAILY STATISTICS SECTION */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 backdrop-blur-md space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3.5">
              <h2 className="font-['Space_Grotesk'] text-lg font-semibold text-[var(--ink)] flex items-center gap-2">
                <Target className="h-5 w-5 text-[var(--nebula)]" /> Daily Focus Statistics
              </h2>
              <span className="text-xs font-mono text-[var(--ink-dim)]">Today</span>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[var(--line)] bg-[rgba(139,127,255,0.06)] p-3.5">
                <p className="font-['JetBrains_Mono'] text-[10.5px] uppercase tracking-wider text-[var(--ink-dim)]">Total Focus Time</p>
                <p className="mt-1 font-['Space_Grotesk'] text-2xl font-bold text-[var(--ink)]">{usedMinutes} <span className="text-xs font-normal text-[var(--ink-dim)]">min</span></p>
                <p className="text-[10px] text-[var(--ink-dim)] mt-1">
                  {Math.floor(usedMinutes / 60)}h {usedMinutes % 60}m logged
                </p>
              </div>

              <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,200,87,0.06)] p-3.5">
                <p className="font-['JetBrains_Mono'] text-[10.5px] uppercase tracking-wider text-[var(--ink-dim)]">Sessions Completed</p>
                <p className="mt-1 font-['Space_Grotesk'] text-2xl font-bold text-[var(--gold)]">{sessions.length}</p>
                <p className="text-[10px] text-[var(--ink-dim)] mt-1">sessions today</p>
              </div>
            </div>

            {/* Target Progress Bar */}
            <div className="space-y-2 rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-4">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-[var(--ink-dim)]">Daily Target Progress</span>
                <span className="text-[var(--gold)] font-bold">{targetProgress}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--nebula),var(--gold))] transition-all duration-500"
                  style={{ width: `${targetProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-[var(--ink-dim)]">
                {usedMinutes >= dailyTargetMin
                  ? "🎉 Target completed for today! Great work!"
                  : `${dailyTargetMin - usedMinutes} mins remaining to reach daily 2h target.`}
              </p>
            </div>

            {/* Focus Log */}
            <div className="space-y-3">
              <h3 className="font-['JetBrains_Mono'] text-[10.5px] uppercase tracking-wider text-[var(--ink-dim)]">Today&apos;s Focus Log</h3>

              {loadingStats ? (
                <p className="text-xs text-[var(--ink-dim)] italic">Loading statistics...</p>
              ) : sessions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--line)] p-5 text-center space-y-1">
                  <Clock className="mx-auto h-5 w-5 text-[var(--ink-dim)]" />
                  <p className="text-xs font-medium text-[var(--ink-dim)]">No focus sessions recorded today yet.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.03)] p-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-[var(--gold)] shrink-0" />
                        <div>
                          <p className="font-semibold text-[var(--ink)]">{s.note || "Focus Session"}</p>
                          <p className="text-[10px] text-[var(--ink-dim)]">
                            {new Date(s.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-[var(--nebula)] bg-[rgba(139,127,255,0.1)] border border-[rgba(139,127,255,0.2)] rounded-lg px-2 py-0.5">
                          +{s.durationMin} m
                        </span>
                        <button
                          type="button"
                          onClick={() => void deleteSession(s.id)}
                          className="grid h-7 w-7 place-items-center rounded-lg text-[var(--ink-dim)] hover:bg-rose-500/10 hover:text-rose-500"
                          aria-label={`Delete ${s.note || "focus session"}`}
                          title="Delete log"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

