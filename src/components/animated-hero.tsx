"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  BrainCircuit,
  FileText,
  Sparkles,
  Timer,
  Youtube,
  Zap,
} from "lucide-react";
import Link from "next/link";

export function AnimatedHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-8 sm:p-10 md:p-12 shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
      {/* Background ambient glow circles */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[rgba(139,127,255,0.12)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[rgba(255,200,87,0.08)] blur-3xl" />

      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center relative z-10">
        {/* Left Column: Hero Text & CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6"
        >
          {/* Eyebrow Kicker */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,200,87,0.3)] bg-[rgba(255,200,87,0.08)] px-3.5 py-1 text-xs font-semibold text-[var(--gold)]">
            <Sparkles className="h-3.5 w-3.5 text-[var(--gold)]" />
            <span>Academic Command Center</span>
          </div>

          {/* High-Contrast Main Heading */}
          <h1 className="font-['Space_Grotesk'] text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--ink)] leading-[1.15]">
            Every topic, <span className="bg-[linear-gradient(135deg,var(--gold),#ffe19c)] bg-clip-text text-transparent">one orbit</span>.
            <span className="block mt-2 text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--ink-dim)]">
              Your complete study universe, synchronized.
            </span>
          </h1>

          {/* Supporting Lead Text */}
          <p className="text-sm sm:text-base text-[var(--ink-dim)] leading-relaxed max-w-xl">
            Keep course PDFs, pending assignments, quick revision notes, deep work focus sessions, and AI summaries seamlessly aligned in one quiet, calm workspace.
          </p>

          {/* Primary & Ghost CTAs */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--nebula),var(--nebula-soft))] px-6 py-3 text-sm font-bold text-white shadow-[0_4px_20px_rgba(139,127,255,0.4)] hover:shadow-[0_6px_28px_rgba(139,127,255,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/auth"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.04)] px-6 py-3 text-sm font-semibold text-[var(--ink)] hover:bg-[rgba(255,255,255,0.09)] hover:border-[var(--nebula)] active:scale-[0.98] transition-all"
            >
              <Zap className="h-4 w-4 text-[var(--gold)]" />
              <span>Sign In</span>
            </Link>
          </div>

          {/* Key Stat Badges */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[var(--line)] max-w-md">
            <div>
              <p className="font-['Space_Grotesk'] text-xl font-bold text-[var(--gold)]">100%</p>
              <p className="text-[11px] text-[var(--ink-dim)] font-mono">Synced Tools</p>
            </div>
            <div>
              <p className="font-['Space_Grotesk'] text-xl font-bold text-[var(--nebula)]">PDFs + AI</p>
              <p className="text-[11px] text-[var(--ink-dim)] font-mono">Linked Material</p>
            </div>
            <div>
              <p className="font-['Space_Grotesk'] text-xl font-bold text-[var(--mint)]">0 Chaos</p>
              <p className="text-[11px] text-[var(--ink-dim)] font-mono">Zero Tab Hopping</p>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Animated Interactive Orbit Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative flex items-center justify-center py-6"
        >
          {/* Celestial Orbit Arena */}
          <div className="relative flex h-80 w-80 sm:h-96 sm:w-96 items-center justify-center">

            {/* Outer Orbit Ring (Dashed, Rotating Slow Clockwise) */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
              className="absolute h-72 w-72 sm:h-88 sm:w-88 rounded-full border border-dashed border-[rgba(241,239,255,0.18)]"
            >
              {/* Outer Satellite 1: PDF */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-[var(--nebula)] bg-[var(--panel)] px-3 py-1 shadow-[0_0_12px_rgba(139,127,255,0.3)]">
                <FileText className="h-3.5 w-3.5 text-[var(--nebula)]" />
                <span className="text-[10px] font-mono font-semibold text-[var(--ink)]">Calculus.pdf</span>
              </div>

              {/* Outer Satellite 2: Reminders */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-[var(--gold)] bg-[var(--panel)] px-3 py-1 shadow-[0_0_12px_rgba(255,200,87,0.3)]">
                <Bell className="h-3.5 w-3.5 text-[var(--gold)]" />
                <span className="text-[10px] font-mono font-semibold text-[var(--ink)]">Due 5:00 PM</span>
              </div>

              {/* Outer Satellite 3: YT Video */}
              <div className="absolute top-1/2 -right-6 -translate-y-1/2 flex items-center gap-1.5 rounded-full border border-[var(--coral)] bg-[var(--panel)] px-3 py-1 shadow-[0_0_12px_rgba(255,140,107,0.3)]">
                <Youtube className="h-3.5 w-3.5 text-[var(--coral)]" />
                <span className="text-[10px] font-mono font-semibold text-[var(--ink)]">Lecture YT</span>
              </div>
            </motion.div>

            {/* Inner Orbit Ring (Dashed, Rotating Counter-Clockwise) */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
              className="absolute h-48 w-48 sm:h-56 sm:w-56 rounded-full border border-dashed border-[rgba(139,127,255,0.3)]"
            >
              {/* Inner Satellite 1: Focus Timer */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-[var(--mint)] bg-[var(--panel)] px-2.5 py-0.5 shadow-[0_0_10px_rgba(111,227,193,0.3)]">
                <Timer className="h-3 w-3 text-[var(--mint)]" />
                <span className="text-[10px] font-mono text-[var(--ink)]">25m Focus</span>
              </div>

              {/* Inner Satellite 2: AI GPT Chat */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-[var(--nebula)] bg-[var(--panel)] px-2.5 py-0.5 shadow-[0_0_10px_rgba(139,127,255,0.3)]">
                <BrainCircuit className="h-3 w-3 text-[var(--nebula)]" />
                <span className="text-[10px] font-mono text-[var(--ink)]">AI Summary</span>
              </div>
            </motion.div>

            {/* Central Core: Student Orbit Node */}
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full border-2 border-[var(--gold)] bg-[radial-gradient(circle_at_30%_30%,#1c2258,var(--void))] shadow-[0_0_30px_rgba(255,200,87,0.4)]"
            >
              <div className="text-center">
                <Sparkles className="mx-auto h-6 w-6 text-[var(--gold)] animate-pulse" />
                <span className="mt-1 block font-['Space_Grotesk'] text-xs font-bold text-[var(--ink)]">
                  StudyOrbit
                </span>
                <span className="block text-[9px] font-mono text-[var(--gold)]">
                  Core Synced
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

