"use client";

import { useState } from "react";
import { Quote, RefreshCw, Sparkles } from "lucide-react";

const QUOTES = [
  "Small breaks create big results.",
  "Rest is part of productivity.",
  "Consistency beats intensity.",
  "Clear minds craft brilliant solutions.",
  "Breathe in clarity, exhale hesitation.",
  "You don't have to rebuild the world in a single hour.",
  "Focus is a muscle that strengthens with proper recovery.",
];

export function QuoteCard() {
  const [index, setIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(false);

  const handleRefresh = () => {
    setIsRotating(true);
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % QUOTES.length);
      setIsRotating(false);
    }, 200);
  };

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6 shadow-lg space-y-4 relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--gold)]" />
          <h3 className="font-['Space_Grotesk'] text-base font-bold text-[var(--ink)]">
            SECTION 6 — Mindful Inspiration
          </h3>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all active:scale-95"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-[var(--gold)] ${isRotating ? "animate-spin" : ""}`} />
          <span>New Quote</span>
        </button>
      </div>

      <div className="flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-[var(--line)] bg-[var(--card)] space-y-3 relative">
        <Quote className="h-8 w-8 text-[var(--gold)] opacity-50" />
        <p className="font-['Space_Grotesk'] text-xl sm:text-2xl font-bold text-[var(--ink)] max-w-lg transition-opacity duration-300">
          &ldquo;{QUOTES[index]}&rdquo;
        </p>
        <span className="text-xs font-mono text-[var(--ink-dim)]">— StudyOrbit Mindfulness Guide</span>
      </div>
    </div>
  );
}
