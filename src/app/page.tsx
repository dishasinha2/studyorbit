import Link from "next/link";
import { ArrowRight, CalendarCheck2, CheckCircle2, FileStack, PenSquare, Sparkles, Timer } from "lucide-react";
import { AppSurface } from "@/components/app-surface";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export default function Home() {
  return (
    <AppSurface>
      <section className="mx-auto max-w-6xl space-y-6">
        <SiteNav active="intro" />

        <section className="panel-strong shell-frame hero-panel overflow-hidden p-8 md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative z-10">
              <p className="section-kicker">
                <Sparkles className="h-3.5 w-3.5" />
                Simple Study Workspace
              </p>
              <h1 className="hero-title mt-4 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
                Study from one clean dashboard.
              </h1>
              <p className="hero-lead mt-4 text-base md:text-lg">
                Plan tasks, save notes, manage files, store useful links, and start a focus session without switching between scattered tools.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/auth" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm">
                  Login <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/dashboard" className="btn-secondary px-5 py-2.5 text-sm">Open Dashboard</Link>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="stat-pill">
                  <p className="stat-value">6</p>
                  <p className="stat-label">Core study tools</p>
                </div>
                <div className="stat-pill">
                  <p className="stat-value">1</p>
                  <p className="stat-label">Focused workspace</p>
                </div>
                <div className="stat-pill">
                  <p className="stat-value">0 clutter</p>
                  <p className="stat-label">Only the work you need</p>
                </div>
              </div>
            </div>

            <div className="relative z-10 hero-grid grid-glow">
              <div className="feature-card-strong">
                <span className="icon-badge">
                  <CalendarCheck2 className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-semibold">Plan your day</h2>
                <p>Tasks, schedule, and reminders in one place.</p>
              </div>
              <div className="feature-card-strong">
                <span className="icon-badge">
                  <FileStack className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-semibold">Manage study material</h2>
                <p>Files, notes, videos, and GPT links stay organized.</p>
              </div>
              <div className="feature-card-strong">
                <span className="icon-badge">
                  <Timer className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-semibold">Stay in focus</h2>
                <p>Run study sessions and breaks with a dedicated timer.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="hero-metric">
                  <p className="hero-metric-value">Today</p>
                  <p className="hero-metric-label">Open the dashboard and continue from where you stopped.</p>
                </div>
                <div className="hero-metric">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Clean flow
                  </div>
                  <p className="hero-metric-label">Capture, organize, and execute without switching contexts.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <div className="feature-card hover-lift">
            <span className="icon-badge mb-3">
              <PenSquare className="h-4 w-4" />
            </span>
            <h2>Notes</h2>
            <p>Write, highlight, and review.</p>
          </div>
          <div className="feature-card hover-lift">
            <span className="icon-badge mb-3">
              <FileStack className="h-4 w-4" />
            </span>
            <h2>Files</h2>
            <p>Store material with progress notes.</p>
          </div>
          <div className="feature-card hover-lift">
            <span className="icon-badge mb-3">
              <Timer className="h-4 w-4" />
            </span>
            <h2>Focus</h2>
            <p>Start study blocks and breaks quickly.</p>
          </div>
        </section>

        <SiteFooter />
      </section>
    </AppSurface>
  );
}
