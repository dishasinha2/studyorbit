import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  FileStack,
  Link2,
  PenSquare,
  Sparkles,
  Timer,
  UserCircle2,
  Youtube,
} from "lucide-react";
import { AppSurface } from "@/components/app-surface";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { UserProfilePanel } from "@/components/user-profile-panel";

const profileShortcuts = [
  { href: "/workspace?module=dashboard", title: "Task Schedule", icon: CalendarCheck, desc: "Track pending and completed work." },
  { href: "/workspace?module=notes", title: "Notes", icon: PenSquare, desc: "Review and continue saved notes." },
  { href: "/workspace?module=files", title: "Files", icon: FileStack, desc: "Open stored study material." },
  { href: "/workspace?module=videos", title: "YouTube Store", icon: Youtube, desc: "Return to saved learning videos." },
  { href: "/workspace?module=study-links", title: "GPT Link Store", icon: Link2, desc: "Check saved prompts and resources." },
  { href: "/workspace?module=focus-lab", title: "Focus Timer", icon: Timer, desc: "Resume focus sessions and streaks." },
];

export default function ProfilePage() {
  return (
    <AppSurface>
      <section className="mx-auto max-w-6xl space-y-6">
        <SiteNav active="profile" />

        <section className="panel-strong shell-frame hero-panel overflow-hidden p-8 md:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="section-kicker">
                <UserCircle2 className="h-3.5 w-3.5" />
                User Profile
              </p>
              <h1 className="hero-title mt-3 max-w-3xl text-3xl font-black leading-tight md:text-5xl">
                Your study identity and activity in one place.
              </h1>
              <p className="hero-lead mt-3 text-base">
                Review your workspace footprint, update your profile, and jump back into the tool you need.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/workspace?module=dashboard" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm">
                  Open Workspace <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/dashboard" className="btn-secondary px-5 py-2.5 text-sm">
                  Back to Dashboard
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="hero-metric">
                <p className="hero-metric-value">Track</p>
                <p className="hero-metric-label">Tasks, notes, files, links, and focus sessions stay visible here.</p>
              </div>
              <div className="hero-metric">
                <p className="hero-metric-value">Return</p>
                <p className="hero-metric-label">Jump back into your workspace without losing context.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <UserProfilePanel />

          <section className="panel shell-frame p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-500">Quick Access</p>
                <h2 className="mt-2 text-2xl font-black text-slate-700">Continue from your profile.</h2>
              </div>
              <Sparkles className="h-5 w-5 text-cyan-500" />
            </div>
            <div className="soft-divider my-5" />
            <div className="grid gap-3 sm:grid-cols-2">
              {profileShortcuts.map((item) => (
                <Link key={item.title} href={item.href} className="feature-card-strong hover-lift">
                  <span className="icon-badge">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <h2 className="mt-3 text-lg font-semibold text-slate-700">{item.title}</h2>
                  <p className="mt-2 text-sm text-slate-500">{item.desc}</p>
                </Link>
              ))}
            </div>
          </section>
        </section>

        <SiteFooter />
      </section>
    </AppSurface>
  );
}
