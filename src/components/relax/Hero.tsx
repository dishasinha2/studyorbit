"use client";

import { Sparkles, Moon, HeartHandshake, ShieldCheck } from "lucide-react";

interface HeroProps {
  onScrollToBreathing?: () => void;
}

export function Hero({ onScrollToBreathing }: HeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,200,87,0.15)_0%,transparent_70%)] blur-2xl" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,200,87,0.3)] bg-[rgba(255,200,87,0.08)] px-3.5 py-1 text-xs font-mono font-bold text-[var(--gold)]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Mindful Recharge Zone</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="font-['Space_Grotesk'] text-3xl sm:text-4xl font-black text-[var(--ink)] tracking-tight">
              🌙 Relax & Recharge
            </h1>

            {/* Breathing Halo Animation */}
            <div className="relative flex h-8 w-8 items-center justify-center shrink-0">
              <span className="absolute h-full w-full rounded-full bg-[var(--gold)]/20 animate-ping" />
              <span className="relative h-5 w-5 rounded-full bg-[linear-gradient(135deg,var(--gold),var(--nebula))] shadow-[0_0_12px_var(--gold)]" />
            </div>
          </div>

          <p className="text-sm sm:text-base text-[var(--ink-dim)] leading-relaxed">
            &ldquo;Take a mindful break. Reset your focus and return stronger.&rdquo;
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-dim)] bg-[var(--card)] px-3 py-1.5 rounded-xl border border-[var(--line)] font-mono">
              <Moon className="h-3.5 w-3.5 text-[var(--nebula)]" /> 100% Calming Audio
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-dim)] bg-[var(--card)] px-3 py-1.5 rounded-xl border border-[var(--line)] font-mono">
              <HeartHandshake className="h-3.5 w-3.5 text-[var(--mint)]" /> Web Audio Synthesizer
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-dim)] bg-[var(--card)] px-3 py-1.5 rounded-xl border border-[var(--line)] font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--gold)]" /> Focus Recovery System
            </span>
          </div>
        </div>

        {/* Quick CTA Card */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 text-center min-w-[200px] space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,200,87,0.15)] text-[var(--gold)] shadow-[0_0_20px_rgba(255,200,87,0.2)]">
            <Moon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-mono font-bold text-[var(--ink-dim)] uppercase">Ready to Unwind?</p>
            <p className="text-sm font-bold text-[var(--ink)]">Box Breathing</p>
          </div>
          <button
            type="button"
            onClick={onScrollToBreathing}
            className="w-full rounded-xl bg-[linear-gradient(135deg,var(--gold),#ffdc93)] px-4 py-2 text-xs font-bold text-[var(--void-deep)] shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            Start Breathing &rarr;
          </button>
        </div>
      </div>
    </section>
  );
}
