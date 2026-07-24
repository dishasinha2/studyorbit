"use client";

import { useEffect, useState } from "react";
import { Wind, Play, Pause, RotateCcw, Sparkles } from "lucide-react";

type PatternType = "box" | "relax_478" | "calm_446" | "custom";

interface PatternConfig {
  id: PatternType;
  name: string;
  inhale: number;
  hold: number;
  exhale: number;
  desc: string;
}

const PATTERNS: PatternConfig[] = [
  { id: "calm_446", name: "Default (4-4-6)", inhale: 4, hold: 4, exhale: 6, desc: "Balanced focus reset" },
  { id: "box", name: "Box Breathing (4-4-4)", inhale: 4, hold: 4, exhale: 4, desc: "Navy SEAL stress relief" },
  { id: "relax_478", name: "Deep Relax (4-7-8)", inhale: 4, hold: 7, exhale: 8, desc: "PNS deep calming pattern" },
  { id: "custom", name: "Custom Pattern", inhale: 5, hold: 3, exhale: 5, desc: "User tailored timing" },
];

export function BreathingExercise() {
  const [selectedPattern, setSelectedPattern] = useState<PatternType>("calm_446");
  const [inhaleSec, setInhaleSec] = useState(4);
  const [holdSec, setHoldSec] = useState(4);
  const [exhaleSec, setExhaleSec] = useState(6);

  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [phaseSeconds, setPhaseSeconds] = useState(4);
  const [cycleCount, setCycleCount] = useState(0);

  const handleSelectPattern = (id: PatternType) => {
    setSelectedPattern(id);
    const config = PATTERNS.find((p) => p.id === id);
    if (config) {
      setInhaleSec(config.inhale);
      setHoldSec(config.hold);
      setExhaleSec(config.exhale);
      setPhaseSeconds(config.inhale);
      setPhase("inhale");
      setIsActive(false);
    }
  };

  // Breathing loop ticker
  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setPhaseSeconds((prev) => {
        if (prev > 1) return prev - 1;

        // Transition to next phase
        if (phase === "inhale") {
          setPhase("hold");
          return holdSec;
        } else if (phase === "hold") {
          setPhase("exhale");
          return exhaleSec;
        } else {
          setPhase("inhale");
          setCycleCount((c) => c + 1);
          return inhaleSec;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, phase, inhaleSec, holdSec, exhaleSec]);

  const resetExercise = () => {
    setIsActive(false);
    setPhase("inhale");
    setPhaseSeconds(inhaleSec);
    setCycleCount(0);
  };

  // Compute ring animation scale and colors based on phase
  let phaseText = "Inhale";
  let phaseColor = "text-[var(--gold)]";
  let ringClass = "scale-100 bg-[rgba(255,200,87,0.2)] border-[var(--gold)] shadow-[0_0_40px_rgba(255,200,87,0.4)]";

  if (phase === "inhale") {
    phaseText = "Expand & Inhale...";
    phaseColor = "text-[var(--gold)]";
    ringClass = "scale-125 bg-[rgba(255,200,87,0.25)] border-[var(--gold)] shadow-[0_0_50px_rgba(255,200,87,0.5)]";
  } else if (phase === "hold") {
    phaseText = "Hold Breath...";
    phaseColor = "text-[var(--nebula)]";
    ringClass = "scale-125 bg-[rgba(139,127,255,0.25)] border-[var(--nebula)] shadow-[0_0_50px_rgba(139,127,255,0.5)]";
  } else if (phase === "exhale") {
    phaseText = "Contract & Exhale...";
    phaseColor = "text-[var(--mint)]";
    ringClass = "scale-90 bg-[rgba(111,227,193,0.15)] border-[var(--mint)] shadow-[0_0_30px_rgba(111,227,193,0.3)]";
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6 shadow-lg space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--gold)]">
            <Sparkles className="h-3.5 w-3.5" /> SECTION 2 — Breathing Exercise
          </div>
          <h2 className="font-['Space_Grotesk'] text-xl font-bold text-[var(--ink)] mt-1">
            Interactive Breathing Trainer
          </h2>
        </div>

        <span className="text-xs font-mono text-[var(--gold)] font-bold bg-[rgba(255,200,87,0.1)] px-3 py-1 rounded-full border border-[rgba(255,200,87,0.25)]">
          Completed Cycles: {cycleCount}
        </span>
      </div>

      {/* Pattern Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PATTERNS.map((p) => {
          const isSelected = selectedPattern === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPattern(p.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? "border-[var(--gold)] bg-[rgba(255,200,87,0.12)] text-[var(--ink)] shadow-[0_0_15px_rgba(255,200,87,0.2)]"
                  : "border-[var(--line)] bg-[var(--card)] text-[var(--ink-dim)] hover:text-[var(--ink)]"
              }`}
            >
              <p className="text-xs font-bold text-[var(--ink)]">{p.name}</p>
              <p className="text-[10px] text-[var(--ink-dim)] mt-0.5 line-clamp-1">{p.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Custom Inputs if selected */}
      {selectedPattern === "custom" && (
        <div className="flex flex-wrap items-center justify-center gap-4 p-3 rounded-xl border border-[var(--line)] bg-[var(--card)] text-xs">
          <label className="flex items-center gap-2 text-[var(--ink-dim)]">
            Inhale (s):
            <input
              type="number"
              min="2"
              max="10"
              value={inhaleSec}
              onChange={(e) => setInhaleSec(Number(e.target.value))}
              className="w-14 rounded-lg border border-[var(--line)] bg-black/40 px-2 py-1 text-center font-bold text-[var(--gold)]"
            />
          </label>
          <label className="flex items-center gap-2 text-[var(--ink-dim)]">
            Hold (s):
            <input
              type="number"
              min="0"
              max="10"
              value={holdSec}
              onChange={(e) => setHoldSec(Number(e.target.value))}
              className="w-14 rounded-lg border border-[var(--line)] bg-black/40 px-2 py-1 text-center font-bold text-[var(--nebula)]"
            />
          </label>
          <label className="flex items-center gap-2 text-[var(--ink-dim)]">
            Exhale (s):
            <input
              type="number"
              min="2"
              max="12"
              value={exhaleSec}
              onChange={(e) => setExhaleSec(Number(e.target.value))}
              className="w-14 rounded-lg border border-[var(--line)] bg-black/40 px-2 py-1 text-center font-bold text-[var(--mint)]"
            />
          </label>
        </div>
      )}

      {/* Interactive Glowing Circle Stage */}
      <div className="flex flex-col items-center justify-center py-8 min-h-[300px]">
        <div className="relative flex items-center justify-center">
          {/* Outer glowing animated ring */}
          <div
            className={`h-56 w-56 sm:h-64 sm:w-64 rounded-full border-2 transition-all duration-1000 ease-in-out flex flex-col items-center justify-center text-center p-4 ${ringClass}`}
          >
            <Wind className="h-8 w-8 text-[var(--gold)] mb-2 animate-pulse" />
            <span className={`text-sm font-bold uppercase tracking-wider font-mono ${phaseColor}`}>
              {isActive ? phaseText : "Tap Start to Begin"}
            </span>
            <span className="font-['Space_Grotesk'] text-4xl sm:text-5xl font-black text-[var(--ink)] mt-2">
              {isActive ? phaseSeconds : inhaleSec}s
            </span>
            <span className="text-[11px] font-mono text-[var(--ink-dim)] mt-1">
              {inhaleSec}s Inhale &bull; {holdSec}s Hold &bull; {exhaleSec}s Exhale
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-8">
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--gold),#ffdc93)] px-6 py-2.5 text-xs font-bold text-[var(--void-deep)] shadow-[0_4px_20px_rgba(255,200,87,0.3)] hover:scale-105 active:scale-95 transition-all"
          >
            {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{isActive ? "Pause Exercise" : "Start Breathing"}</span>
          </button>

          <button
            type="button"
            onClick={resetExercise}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-2.5 text-xs font-semibold text-[var(--ink)] hover:border-[var(--gold)] transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[var(--ink-dim)]" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
}
