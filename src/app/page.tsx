import Link from "next/link";
import {
  ArrowRight,
  Bell,
  FileText,
  Headphones,
  PenSquare,
  Sparkles,
  Timer,
  Youtube,
  Zap,
} from "lucide-react";
import { AnimatedHero } from "@/components/animated-hero";
import { AppSurface } from "@/components/app-surface";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

const featureGrid = [
  {
    id: "pdf-vault",
    title: "PDF Vault & Tagging",
    category: "DOCUMENTS",
    description: "Upload, tag, and categorize lecture slides, textbook chapters, and past exam papers in one searchable vault.",
    icon: FileText,
    accent: "rgba(139,127,255,0.15)",
    iconColor: "var(--nebula)",
    href: "/documents",
    cta: "Manage PDFs",
  },
  {
    id: "tasks-reminders",
    title: "Task & Reminder Radar",
    category: "REMINDERS",
    description: "Keep track of assignment due dates, exam milestones, and daily study goals with browser notification alerts.",
    icon: Bell,
    accent: "rgba(255,200,87,0.15)",
    iconColor: "var(--gold)",
    href: "/notifications",
    cta: "View Reminders",
  },
  {
    id: "focus-timer",
    title: "Deep Work Focus Timer",
    category: "FOCUS & BREAKS",
    description: "Boost retention using customizable Pomodoro cycles, interval timers, session logging, and subtle audio cues.",
    icon: Timer,
    accent: "rgba(255,140,107,0.15)",
    iconColor: "var(--coral)",
    href: "/focus",
    cta: "Start Focus",
  },
  {
    id: "linked-youtube-gpt",
    title: "YouTube & GPT Link Orbit",
    category: "SMART MEDIA",
    description: "Link specific lecture YouTube timestamps and AI-generated concept summaries directly to your study topics.",
    icon: Youtube,
    accent: "rgba(111,227,193,0.15)",
    iconColor: "var(--mint)",
    href: "/workspace",
    cta: "Explore Links",
  },
  {
    id: "quick-notes",
    title: "Sticky Notes & Whiteboard",
    category: "IDEAS & SKETCHES",
    description: "Pin quick study reminders to your workspace or draw diagrams and equations on the freeform canvas.",
    icon: PenSquare,
    accent: "rgba(139,127,255,0.15)",
    iconColor: "var(--nebula)",
    href: "/workspace",
    cta: "Open Notes",
  },
  {
    id: "relax-audio",
    title: "Relaxation & Lofi Beats",
    category: "RELAXATION",
    description: "Unwind during break intervals with curated lofi music, rain soundscapes, and calming ambient noise.",
    icon: Headphones,
    accent: "rgba(255,200,87,0.15)",
    iconColor: "var(--gold)",
    href: "/relax",
    cta: "Listen Now",
  },
];

export default function Home() {
  return (
    <AppSurface>
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        {/* Navigation */}
        <SiteNav active="intro" />

        {/* Hero Section */}
        <AnimatedHero />

        {/* Bento Feature Grid Section */}
        <section className="space-y-6 pt-4">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--line)] pb-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-widest text-[var(--gold)]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Integrated Study System</span>
              </div>
              <h2 className="mt-1 font-['Space_Grotesk'] text-2xl sm:text-3xl font-extrabold text-[var(--ink)]">
                Everything you need to study in flow.
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[var(--ink-dim)] max-w-md">
              No disconnected tools. Every note, PDF, reminder, and focus session communicates in one synchronized orbit.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featureGrid.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--nebula)]/50 hover:shadow-[0_8px_30px_rgba(139,127,255,0.15)]"
                >
                  <div className="space-y-4">
                    {/* Top Row: Icon Badge & Category Tag */}
                    <div className="flex items-center justify-between">
                      <span
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                        style={{
                          background: feature.accent,
                          color: feature.iconColor,
                        }}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="font-mono text-[10px] font-semibold tracking-wider text-[var(--ink-dim)] uppercase bg-[var(--card)] px-2.5 py-1 rounded-full border border-[var(--line)]">
                        {feature.category}
                      </span>
                    </div>

                    {/* Content */}
                    <div>
                      <h3 className="font-['Space_Grotesk'] text-lg font-bold text-[var(--ink)] group-hover:text-[var(--gold)] transition-colors">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm text-[var(--ink-dim)] leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  {/* CTA Link */}
                  <div className="mt-6 pt-4 border-t border-[var(--line)]">
                    <Link
                      href={feature.href}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--nebula)] hover:text-[var(--gold)] transition-colors"
                    >
                      <span>{feature.cta}</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Call to Action Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-[rgba(255,200,87,0.3)] bg-[radial-gradient(ellipse_at_top,_var(--panel),_var(--void))] p-8 sm:p-10 text-center shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-3 py-1 text-xs font-mono font-bold text-[var(--gold)]">
              <Zap className="h-3.5 w-3.5" /> Ready for distraction-free learning?
            </span>
            <h2 className="font-['Space_Grotesk'] text-2xl sm:text-4xl font-extrabold text-[var(--ink)]">
              Launch your personal study orbit today.
            </h2>
            <p className="text-sm text-[var(--ink-dim)]">
              Organize course material, set task reminders, and step into deep work in under 30 seconds.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--gold),#ffe19c)] px-6 py-3 text-xs font-black text-slate-950 shadow-[0_4px_20px_rgba(255,200,87,0.35)] hover:scale-105 transition-all"
              >
                <span>Launch Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Site Footer */}
        <SiteFooter />
      </div>
    </AppSurface>
  );
}

