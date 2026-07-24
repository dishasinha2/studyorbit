"use client";

import { useEffect, useState } from "react";
import { Activity, Play, Pause, RotateCcw, Eye, Hand, UserCheck, Sparkles } from "lucide-react";

interface StretchCardData {
  id: string;
  title: string;
  icon: React.ElementType;
  steps: string[];
}

const STRETCHES: StretchCardData[] = [
  {
    id: "neck",
    title: "Neck Stretch",
    icon: UserCheck,
    steps: [
      "Tilt your right ear gently toward your right shoulder.",
      "Hold for 15 seconds without forcing.",
      "Repeat smoothly on the left side.",
    ],
  },
  {
    id: "shoulder",
    title: "Shoulder Roll",
    icon: Activity,
    steps: [
      "Roll both shoulders backward in slow circular motions.",
      "Inhale as shoulders go up, exhale as they drop down.",
      "Repeat 5 backward rolls, then 5 forward rolls.",
    ],
  },
  {
    id: "eye",
    title: "Eye Relaxation",
    icon: Eye,
    steps: [
      "Blink slowly 10 times to re-moisten your eyes.",
      "Look at a distant object 20 feet away for 15 seconds.",
      "Gently close your eyes and rub hands together to apply soft warmth.",
    ],
  },
  {
    id: "wrist",
    title: "Wrist Stretch",
    icon: Hand,
    steps: [
      "Extend arm straight forward with palm facing up.",
      "Use opposite hand to gently pull fingers back toward wrist.",
      "Hold for 15 seconds per hand.",
    ],
  },
  {
    id: "back",
    title: "Back Stretch",
    icon: Activity,
    steps: [
      "Sit tall, place hands on hips, and gently arch back.",
      "Squeeze shoulder blades together and lift chest slightly.",
      "Hold for 20 seconds while taking deep steady breaths.",
    ],
  },
];

export function StretchGuide() {
  const [activeTimerStretch, setActiveTimerStretch] = useState<string | null>(null);
  const [timerSecs, setTimerSecs] = useState<number>(30);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    if (!isTimerRunning || !activeTimerStretch) return;

    const interval = setInterval(() => {
      setTimerSecs((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, activeTimerStretch]);

  const startStretchTimer = (stretchId: string) => {
    setActiveTimerStretch(stretchId);
    setTimerSecs(30);
    setIsTimerRunning(true);
  };

  const resetTimer = () => {
    setTimerSecs(30);
    setIsTimerRunning(false);
  };

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6 shadow-lg space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--gold)]">
            <Sparkles className="h-3.5 w-3.5" /> SECTION 7 — Mini Stretch Guide
          </div>
          <h2 className="font-['Space_Grotesk'] text-xl font-bold text-[var(--ink)] mt-1">
            Ergonomic Desk Stretches
          </h2>
        </div>

        <span className="text-xs font-mono text-[var(--ink-dim)]">
          30-Second Guided Timers
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {STRETCHES.map((stretch) => {
          const Icon = stretch.icon;
          const isCurrent = activeTimerStretch === stretch.id;

          return (
            <div
              key={stretch.id}
              className={`rounded-2xl border p-4 flex flex-col justify-between space-y-3 transition-all duration-300 ${
                isCurrent
                  ? "border-[var(--gold)] bg-[rgba(255,200,87,0.1)] shadow-[0_0_20px_rgba(255,200,87,0.2)]"
                  : "border-[var(--line)] bg-[var(--card)] hover:border-[rgba(255,255,255,0.2)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(255,200,87,0.15)] text-[var(--gold)] font-bold">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-['Space_Grotesk'] text-sm font-bold text-[var(--ink)]">
                    {stretch.title}
                  </h3>
                </div>

                <span className="text-[10px] font-mono text-[var(--gold)] font-bold bg-[rgba(255,200,87,0.1)] px-2 py-0.5 rounded-full">
                  30s
                </span>
              </div>

              {/* Steps List */}
              <ul className="space-y-1.5 text-xs text-[var(--ink-dim)] pl-1">
                {stretch.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[var(--gold)] font-mono text-[10px] mt-0.5">•</span>
                    <span className="leading-tight">{step}</span>
                  </li>
                ))}
              </ul>

              {/* Timer Bar & Controls */}
              <div className="pt-2 border-t border-[var(--line)]">
                {isCurrent ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span className="text-[var(--gold)]">
                        {timerSecs > 0 ? `Time Remaining: ${timerSecs}s` : "Stretch Completed! 🎉"}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setIsTimerRunning(!isTimerRunning)}
                          className="p-1 text-[var(--ink)] hover:text-[var(--gold)]"
                        >
                          {isTimerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={resetTimer}
                          className="p-1 text-[var(--ink-dim)] hover:text-[var(--ink)]"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="h-1.5 w-full rounded-full bg-black/40 overflow-hidden">
                      <div
                        className="h-full bg-[var(--gold)] transition-all duration-1000 ease-linear"
                        style={{ width: `${(timerSecs / 30) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startStretchTimer(stretch.id)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[rgba(255,255,255,0.06)] py-2 text-xs font-bold text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--gold)] hover:text-[var(--void-deep)] transition-all"
                  >
                    <Play className="h-3.5 w-3.5 ml-0.5" />
                    <span>Start 30s Timer</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
