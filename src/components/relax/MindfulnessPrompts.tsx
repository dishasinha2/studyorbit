"use client";

import { useEffect, useState } from "react";
import { Sparkles, ChevronLeft, ChevronRight, Eye, Droplet, User, Monitor, Heart } from "lucide-react";

interface PromptItem {
  id: string;
  text: string;
  icon: React.ElementType;
  tip: string;
}

const PROMPTS: PromptItem[] = [
  { id: "p1", text: "Close your eyes for one minute.", icon: Eye, tip: "Reduces visual fatigue and sensory overload." },
  { id: "p2", text: "Relax your shoulders and drop your jaw.", icon: User, tip: "Releases subconscious tension stored in muscles." },
  { id: "p3", text: "Drink a glass of fresh water.", icon: Droplet, tip: "Hydration boosts mental clarity and focus." },
  { id: "p4", text: "Stretch your back and lengthen your spine.", icon: Heart, tip: "Improves blood flow and oxygen intake." },
  { id: "p5", text: "Look away from your screen at an object 20 feet away.", icon: Monitor, tip: "The 20-20-20 rule prevents digital eye strain." },
];

export function MindfulnessPrompts() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Auto-rotate every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((old) => {
        if (old >= 100) {
          setCurrentIndex((idx) => (idx + 1) % PROMPTS.length);
          return 0;
        }
        return old + 5; // 20 updates = 100% in 20s
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const current = PROMPTS[currentIndex];
  const Icon = current.icon;

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--gold)]" />
          <h3 className="font-['Space_Grotesk'] text-base font-bold text-[var(--ink)]">
            SECTION 3 — Mindfulness Prompts
          </h3>
        </div>
        <span className="text-xs font-mono text-[var(--gold)]">Auto-rotates every 20s</span>
      </div>

      <div className="relative rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 overflow-hidden flex flex-col items-center text-center space-y-3">
        {/* Progress Bar Top */}
        <div className="absolute top-0 left-0 h-1 bg-[var(--card)] w-full overflow-hidden">
          <div
            className="h-full bg-[linear-gradient(90deg,var(--nebula),var(--gold))]"
            style={{ width: `${progress}%`, transition: "width 1s linear" }}
          />
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(255,200,87,0.15)] text-[var(--gold)] shadow-md mt-2">
          <Icon className="h-6 w-6" />
        </div>

        <h4 className="font-['Space_Grotesk'] text-xl sm:text-2xl font-black text-[var(--ink)] max-w-xl">
          &ldquo;{current.text}&rdquo;
        </h4>

        <p className="text-xs font-mono text-[var(--ink-dim)] bg-[rgba(255,255,255,0.03)] px-3 py-1 rounded-full border border-[var(--line)]">
          💡 {current.tip}
        </p>

        {/* Carousel controls */}
        <div className="flex items-center gap-3 pt-3">
          <button
            type="button"
            onClick={() => {
              setCurrentIndex((idx) => (idx - 1 + PROMPTS.length) % PROMPTS.length);
              setProgress(0);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)] bg-[rgba(255,255,255,0.05)] text-[var(--ink)] hover:border-[var(--gold)] transition"
            aria-label="Previous Prompt"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="text-xs font-mono text-[var(--ink-dim)]">
            {currentIndex + 1} / {PROMPTS.length}
          </span>

          <button
            type="button"
            onClick={() => {
              setCurrentIndex((idx) => (idx + 1) % PROMPTS.length);
              setProgress(0);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)] bg-[rgba(255,255,255,0.05)] text-[var(--ink)] hover:border-[var(--gold)] transition"
            aria-label="Next Prompt"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
