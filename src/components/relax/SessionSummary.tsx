"use client";

import Link from "next/link";
import { Clock, Headphones, Smile, ArrowRight, Zap, Sparkles } from "lucide-react";

interface SessionSummaryProps {
  timeRelaxedMins?: number;
  soundsUsed?: string[];
  moodBefore?: string;
  moodAfter?: string;
}

export function SessionSummary({
  timeRelaxedMins = 18,
  soundsUsed = ["Gentle Rain", "Spotify Deep Focus"],
  moodBefore = "Tired 😔",
  moodAfter = "Refreshed 😄",
}: SessionSummaryProps) {
  return (
    <div className="rounded-2xl border border-[rgba(255,200,87,0.3)] bg-[linear-gradient(135deg,rgba(255,200,87,0.08),rgba(139,127,255,0.08))] p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[var(--gold)]" />
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-[var(--gold)]">
              SECTION 9 — Session Summary
            </span>
            <h2 className="font-['Space_Grotesk'] text-xl sm:text-2xl font-black text-[var(--ink)]">
              Mindful Break Summary
            </h2>
          </div>
        </div>

        <span className="rounded-full bg-[rgba(111,227,193,0.15)] px-3 py-1 text-xs font-mono font-bold text-[var(--mint)] border border-[rgba(111,227,193,0.3)]">
          100% Recharge Complete
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-4 space-y-1">
          <div className="flex items-center gap-2 text-[var(--gold)] text-xs font-mono">
            <Clock className="h-4 w-4" /> Time Relaxed
          </div>
          <p className="font-['Space_Grotesk'] text-2xl font-black text-[var(--ink)]">
            {timeRelaxedMins} mins
          </p>
        </div>

        {/* Metric 2 */}
        <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-4 space-y-1">
          <div className="flex items-center gap-2 text-[var(--nebula)] text-xs font-mono">
            <Headphones className="h-4 w-4" /> Sounds Used
          </div>
          <p className="text-xs font-bold text-[var(--ink)] line-clamp-2">
            {soundsUsed.join(" • ")}
          </p>
        </div>

        {/* Metric 3 */}
        <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-4 space-y-1">
          <div className="flex items-center gap-2 text-[var(--coral)] text-xs font-mono">
            <Smile className="h-4 w-4" /> Mood Transition
          </div>
          <p className="text-xs font-bold text-[var(--ink)]">
            {moodBefore} &rarr; <span className="text-[var(--mint)]">{moodAfter}</span>
          </p>
        </div>

        {/* Metric 4 */}
        <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-4 space-y-1">
          <div className="flex items-center gap-2 text-[var(--mint)] text-xs font-mono">
            <Zap className="h-4 w-4" /> Focus Recovery
          </div>
          <p className="font-['Space_Grotesk'] text-2xl font-black text-[var(--mint)]">
            +35% Clarity
          </p>
        </div>
      </div>

      {/* Suggested Next Action CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5">
        <div>
          <p className="text-xs font-mono font-bold text-[var(--gold)]">Suggested Next Action:</p>
          <p className="font-['Space_Grotesk'] text-base font-bold text-[var(--ink)] mt-0.5">
            &ldquo;Ready for another 25-minute focus session?&rdquo;
          </p>
          <p className="text-xs text-[var(--ink-dim)]">
            Your mind is restored and ready for high-retention learning.
          </p>
        </div>

        <Link
          href="/focus"
          className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--gold),#ffdc93)] px-6 py-3 text-xs font-bold text-[var(--void-deep)] shadow-[0_4px_20px_rgba(255,200,87,0.3)] hover:scale-105 active:scale-95 transition-all shrink-0"
        >
          <span>Return to Focus Mode</span>
          <ArrowRight className="h-4 w-4 stroke-[3]" />
        </Link>
      </div>
    </div>
  );
}
