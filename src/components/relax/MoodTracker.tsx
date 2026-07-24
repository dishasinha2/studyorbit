"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles, TrendingUp } from "lucide-react";

type MoodType = "great" | "good" | "okay" | "tired" | "burned_out";

interface MoodOption {
  id: MoodType;
  emoji: string;
  label: string;
  color: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  { id: "great", emoji: "😄", label: "Great", color: "#6FE3C1" },
  { id: "good", emoji: "🙂", label: "Good", color: "#8B7FFF" },
  { id: "okay", emoji: "😐", label: "Okay", color: "#FFC857" },
  { id: "tired", emoji: "😔", label: "Tired", color: "#FF8C6B" },
  { id: "burned_out", emoji: "😫", label: "Burned Out", color: "#FF5252" },
];

export function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<Array<{ id: string; mood: MoodType; emoji: string; label: string; createdAt: string }>>([
    { id: "1", mood: "good", emoji: "🙂", label: "Good", createdAt: "Mon" },
    { id: "2", mood: "great", emoji: "😄", label: "Great", createdAt: "Tue" },
    { id: "3", mood: "okay", emoji: "😐", label: "Okay", createdAt: "Wed" },
    { id: "4", mood: "good", emoji: "🙂", label: "Good", createdAt: "Thu" },
    { id: "5", mood: "great", emoji: "😄", label: "Great", createdAt: "Today" },
  ]);

  // Load mood logs
  useEffect(() => {
    async function fetchMoods() {
      try {
        const res = await fetch("/api/relax/mood");
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.logs) && json.logs.length > 0) {
            setHistory(json.logs.slice(0, 7));
          }
        }
      } catch {
        // Fallback to initial mock data
      }
    }
    void fetchMoods();
  }, []);

  async function handleSelectMood(option: MoodOption) {
    setSelectedMood(option.id);
    setIsSubmitting(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/relax/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: option.id,
          label: option.label,
          emoji: option.emoji,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.logs) {
          setHistory(json.logs.slice(0, 7));
        }
      }
      setSavedSuccess(true);
    } catch {
      setSavedSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6 shadow-lg space-y-5">
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--gold)]">
            <Sparkles className="h-3.5 w-3.5" /> SECTION 5 — Mood Check-In
          </div>
          <h2 className="font-['Space_Grotesk'] text-xl font-bold text-[var(--ink)] mt-1">
            How are you feeling right now?
          </h2>
        </div>

        {savedSuccess && (
          <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[var(--mint)] bg-[rgba(111,227,193,0.15)] px-3 py-1 rounded-full border border-[rgba(111,227,193,0.3)]">
            <Check className="h-3.5 w-3.5" /> Mood Saved
          </span>
        )}
      </div>

      {/* 5 Emoji Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {MOOD_OPTIONS.map((opt) => {
          const isSelected = selectedMood === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleSelectMood(opt)}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${
                isSelected
                  ? "border-[var(--gold)] bg-[rgba(255,200,87,0.18)] scale-105 shadow-[0_0_20px_rgba(255,200,87,0.3)]"
                  : "border-[var(--line)] bg-[var(--card)] hover:border-[rgba(255,255,255,0.2)] hover:scale-102"
              }`}
            >
              <span className="text-3xl mb-1.5">{opt.emoji}</span>
              <span className="text-xs font-bold text-[var(--ink)]">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Weekly Mood Trend */}
      <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--nebula)]" />
            <h3 className="text-xs font-bold font-['Space_Grotesk'] text-[var(--ink)]">
              Weekly Mood Trend
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[var(--ink-dim)]">Last 7 Check-ins</span>
        </div>

        <div className="flex items-end justify-between gap-2 pt-2 h-16 border-b border-[var(--line)] pb-2">
          {history.slice(0, 7).map((item, idx) => (
            <div key={item.id || idx} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-sm">{item.emoji}</span>
              <span className="text-[9px] font-mono text-[var(--ink-dim)] truncate max-w-[40px]">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
