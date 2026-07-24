import {
  ArrowRight,
  Bell,
  FileText,
  Sparkles,
  Timer,
  Youtube,
} from "lucide-react";
import Link from "next/link";

export function AnimatedHero() {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--panel)] p-7 sm:p-10 lg:px-14 lg:py-12 shadow-[0_12px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl">
      {/* Background ambient glow circles */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[rgba(139,127,255,0.12)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[rgba(255,200,87,0.08)] blur-3xl" />

      <div className="relative z-10 grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-16">
        {/* Left Column: Hero Text & CTAs */}
        <div className="max-w-xl space-y-6">
          {/* Eyebrow Kicker */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,200,87,0.3)] bg-[rgba(255,200,87,0.08)] px-3.5 py-1 text-[10px] font-mono font-medium uppercase tracking-wider text-[var(--gold)]">
            <Sparkles className="h-3.5 w-3.5 text-[var(--gold)]" />
            <span>Academic Command Center</span>
          </div>

          {/* High-Contrast Main Heading */}
          <div className="space-y-5">
            <h1 className="font-['Space_Grotesk'] text-4xl font-bold leading-[1.08] tracking-tight text-[var(--ink)] sm:text-[52px]">
              Every topic, <span className="bg-[linear-gradient(135deg,var(--gold),#ffe19c)] bg-clip-text text-transparent">one orbit</span>.
            </h1>
            <p className="text-base font-medium text-[var(--ink-dim)] sm:text-lg">
              A calm home for every deadline, document, and focus block.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 pt-1">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--nebula),var(--nebula-soft))] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(139,127,255,0.35)] transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_6px_28px_rgba(139,127,255,0.6)] active:scale-[0.98]"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link href="#features" className="text-sm font-medium text-[var(--ink-dim)] transition-colors duration-200 hover:text-[var(--gold)]">
              See how it works <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="grid max-w-lg grid-cols-3 gap-2 pt-3 sm:gap-3">
            <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.025)] p-3 backdrop-blur-sm">
              <p className="font-['Space_Grotesk'] text-lg font-bold text-[var(--gold)]">100%</p>
              <p className="mt-1 text-[10px] font-mono text-[var(--ink-dim)]">SYNCED TOOLS</p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.025)] p-3 backdrop-blur-sm">
              <p className="font-['Space_Grotesk'] text-lg font-bold text-[var(--nebula)]">PDFs + AI</p>
              <p className="mt-1 text-[10px] font-mono text-[var(--ink-dim)]">LINKED MATERIAL</p>
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.025)] p-3 backdrop-blur-sm">
              <p className="font-['Space_Grotesk'] text-lg font-bold text-[var(--mint)]">0 chaos</p>
              <p className="mt-1 text-[10px] font-mono text-[var(--ink-dim)]">TAB HOPPING</p>
            </div>
          </div>
        </div>

        {/* Right Column: Animated Interactive Orbit Visual */}
        <div className="relative flex min-h-[360px] items-center justify-center rounded-3xl border border-[rgba(241,239,255,0.07)] bg-[rgba(6,8,20,0.2)] p-6 sm:min-h-[400px]">
          {/* Celestial Orbit Arena */}
          <div className="relative flex h-[340px] w-[340px] items-center justify-center sm:h-[390px] sm:w-[390px]">

            {/* Outer Orbit Ring (Dashed, Rotating Slow Clockwise) */}
            <div className="orbit-ring orbit-ring-outer landing-orbit-outer" />

            {/* Inner Orbit Ring (Dashed, Rotating Counter-Clockwise) */}
            <div className="orbit-ring orbit-ring-inner landing-orbit-inner" />

            <div className="absolute -top-1 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[rgba(139,127,255,0.75)] bg-[rgba(16,20,58,0.8)] px-2.5 py-0.5 shadow-[0_0_8px_rgba(139,127,255,0.14)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_12px_rgba(139,127,255,0.24)]">
              <FileText className="h-3 w-3 text-[var(--nebula)]" /><span className="text-[9px] font-mono text-[var(--ink)]">Calculus.pdf</span>
            </div>
            <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full border border-[rgba(255,140,107,0.75)] bg-[rgba(16,20,58,0.8)] px-2.5 py-0.5 shadow-[0_0_8px_rgba(255,140,107,0.12)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_12px_rgba(255,140,107,0.2)]">
              <Youtube className="h-3 w-3 text-[var(--coral)]" /><span className="text-[9px] font-mono text-[var(--ink)]">Lecture</span>
            </div>
            <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[rgba(255,200,87,0.75)] bg-[rgba(16,20,58,0.8)] px-2.5 py-0.5 shadow-[0_0_8px_rgba(255,200,87,0.12)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_12px_rgba(255,200,87,0.2)]">
              <Bell className="h-3 w-3 text-[var(--gold)]" /><span className="text-[9px] font-mono text-[var(--ink)]">Due today</span>
            </div>
            <div className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full border border-[rgba(111,227,193,0.75)] bg-[rgba(16,20,58,0.8)] px-2.5 py-0.5 shadow-[0_0_8px_rgba(111,227,193,0.12)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_12px_rgba(111,227,193,0.2)]">
              <Timer className="h-3 w-3 text-[var(--mint)]" /><span className="text-[9px] font-mono text-[var(--ink)]">25m focus</span>
            </div>

            {/* Central Core: Student Orbit Node */}
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(255,200,87,0.7)] bg-[radial-gradient(circle_at_30%_30%,#1c2258,var(--void))] shadow-[0_0_20px_rgba(255,200,87,0.22)] sm:h-24 sm:w-24">
              <div className="text-center">
                <Sparkles className="mx-auto h-5 w-5 text-[var(--gold)]" />
                <span className="mt-1 block font-['Space_Grotesk'] text-xs font-bold text-[var(--ink)]">
                  StudyOrbit
                </span>
                <span className="block text-[9px] font-mono text-[var(--gold)]">
                  Core Synced
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

