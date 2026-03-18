import Link from "next/link";
import { ArrowRight, CalendarCheck, Clock3, FileStack, Flame, Link2, PenSquare, Sparkles, Timer, Youtube } from "lucide-react";
import { AppSurface } from "@/components/app-surface";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

const modules = [
  { href: "/workspace?module=dashboard", title: "Task Schedule", icon: CalendarCheck },
  { href: "/workspace?module=files", title: "File Management", icon: FileStack },
  { href: "/workspace?module=notes", title: "Notes", icon: PenSquare },
  { href: "/workspace?module=videos", title: "YouTube Store", icon: Youtube },
  { href: "/workspace?module=study-links", title: "GPT Link Store", icon: Link2 },
  { href: "/workspace?module=focus-lab", title: "Focus Timer", icon: Timer },
];

export default function DashboardPage() {
  return (
    <AppSurface>
      <section className="mx-auto max-w-6xl space-y-6">
        <SiteNav active="dashboard" />

        <section className="dashboard-grid">
          <section className="panel-strong shell-frame hero-panel dashboard-span-8 overflow-hidden p-8 md:p-10">
            <p className="section-kicker">
              <Sparkles className="h-3.5 w-3.5" />
              User Dashboard
            </p>
            <h1 className="hero-title mt-3 max-w-3xl text-3xl font-black leading-tight md:text-5xl">
              Your study tools. One dashboard.
            </h1>
            <p className="hero-lead mt-3 text-base">
              Open the exact tool you need and continue work without scrolling through a crowded page.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/workspace?module=dashboard" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm">
                Open Workspace <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/auth" className="btn-secondary px-5 py-2.5 text-sm">Switch Account</Link>
            </div>
            <div className="mt-8 grid gap-3 md:grid-cols-3">
              <div className="metric-tile">
                <div className="sub-title"><Clock3 className="h-3.5 w-3.5" /> Flow</div>
                <p className="mt-2 text-lg font-semibold text-slate-700">Intro - Login - Dashboard - Workspace</p>
              </div>
              <div className="metric-tile">
                <div className="sub-title"><FileStack className="h-3.5 w-3.5" /> Core tools</div>
                <p className="mt-2 text-lg font-semibold text-slate-700">Files - Notes - Links - Tasks - Focus</p>
              </div>
              <div className="metric-tile">
                <div className="sub-title"><Flame className="h-3.5 w-3.5" /> Focus mode</div>
                <p className="mt-2 text-lg font-semibold text-slate-700">Focus - Break - Repeat</p>
              </div>
            </div>
          </section>

          <aside className="panel shell-frame dashboard-span-4 p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-500">Quick Start</p>
            <div className="mt-4 space-y-3">
              <Link href="/workspace?module=dashboard" className="feature-card-strong block">
                <h2 className="text-lg font-semibold text-slate-700">Start today&apos;s plan</h2>
              </Link>
              <Link href="/workspace?module=files" className="feature-card-strong block">
                <h2 className="text-lg font-semibold text-slate-700">Continue a file</h2>
              </Link>
              <Link href="/workspace?module=focus-lab" className="feature-card-strong block">
                <h2 className="text-lg font-semibold text-slate-700">Start a focus session</h2>
              </Link>
            </div>
          </aside>
        </section>

        <section className="panel shell-frame p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-500">Modules</p>
              <h2 className="mt-2 text-2xl font-black text-slate-700">Open one tool and continue work.</h2>
            </div>
            <Link href="/workspace" className="btn-secondary px-4 py-2 text-sm">View full workspace</Link>
          </div>
          <div className="soft-divider my-5" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {modules.map((module) => (
              <Link key={module.title} href={module.href} className="feature-card-strong hover-lift">
                <span className="icon-badge">
                  <module.icon className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-semibold text-slate-700">{module.title}</h2>
              </Link>
            ))}
          </div>
        </section>

        <SiteFooter />
      </section>
    </AppSurface>
  );
}
