"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles, TrendingUp } from "lucide-react";

type MoodType = "great" | "good" | "okay" | "tired" | "burned_out";
type MoodEntry = { id: string; mood: MoodType; emoji: string; label: string; createdAt: string };
const options = [{ id: "great", emoji: "😊", label: "Great" }, { id: "good", emoji: "🙂", label: "Good" }, { id: "okay", emoji: "😐", label: "Okay" }, { id: "tired", emoji: "😔", label: "Tired" }, { id: "burned_out", emoji: "😫", label: "Burned out" }] as const;

export function MoodTracker() {
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { void fetch("/api/relax/mood").then(async (response) => response.ok ? response.json() : { logs: [] }).then((data) => setHistory(Array.isArray(data.logs) ? data.logs.slice(0, 7) : [])).catch(() => setHistory([])); }, []);

  async function saveMood(option: (typeof options)[number]) {
    setSelectedMood(option.id); setSaving(true); setSaved(false);
    try {
      const response = await fetch("/api/relax/mood", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mood: option.id, label: option.label, emoji: option.emoji }) });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.logs) { setHistory(data.logs.slice(0, 7)); setSaved(true); }
    } finally { setSaving(false); }
  }

  return <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-lg sm:p-6"><div className="flex items-center justify-between border-b border-[var(--line)] pb-4"><div><p className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--gold)]"><Sparkles className="h-3.5 w-3.5" /> Mood check-in</p><h2 className="mt-1 font-['Space_Grotesk'] text-xl font-bold text-[var(--ink)]">How are you feeling right now?</h2></div>{saved && <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[var(--mint)]"><Check className="h-3.5 w-3.5" /> Saved</span>}</div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">{options.map((option) => <button key={option.id} type="button" disabled={saving} onClick={() => void saveMood(option)} className={`rounded-xl border p-3 text-center transition-transform duration-200 hover:scale-[1.02] ${selectedMood === option.id ? "border-[var(--gold)] bg-[rgba(255,200,87,0.12)]" : "border-[var(--line)] bg-[var(--card)]"}`}><span className="block text-2xl">{option.emoji}</span><span className="mt-1 block text-xs font-medium text-[var(--ink)]">{option.label}</span></button>)}</div><div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--card)] p-4"><div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-[var(--nebula)]" /><h3 className="text-xs font-bold text-[var(--ink)]">Recent check-ins</h3></div>{history.length === 0 ? <p className="mt-3 text-sm text-[var(--ink-dim)]">No check-ins yet. Your first selection will appear here.</p> : <div className="mt-3 flex items-end gap-2">{history.map((item) => <div key={item.id} className="min-w-0 flex-1 text-center"><span className="text-lg">{item.emoji}</span><span className="block truncate text-[10px] text-[var(--ink-dim)]">{item.label}</span></div>)}</div>}</div></section>;
}
