"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  CheckSquare,
  Headphones,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  Timer,
  UserCircle,
  X,
} from "lucide-react";
import { clearFirebaseSession, onAuthChange, type FirebaseSession } from "@/lib/firebase-client";

type SiteNavProps = {
  active?:
    | "intro"
    | "auth"
    | "dashboard"
    | "features"
    | "profile"
    | "documents"
    | "ai"
    | "relax"
    | "focus"
    | "notifications"
    | "tasks";
};

function navClass(active: boolean) {
  return active
    ? "relative rounded-full bg-[rgba(139,127,255,0.16)] px-4 py-1.5 text-xs font-semibold text-[var(--ink)] ring-1 ring-[rgba(139,127,255,0.35)] transition-all duration-200"
    : "rounded-full px-3.5 py-1.5 text-xs font-medium text-[var(--ink-dim)] transition-all duration-200 hover:scale-[1.03] hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--ink)]";
}

export function SiteNav({ active }: SiteNavProps) {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<FirebaseSession["user"] | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    return onAuthChange((session) => setSessionUser(session?.user ?? null));
  }, []);

  async function signOut() {
    await clearFirebaseSession();
    setMenuOpen(false);
    setMobileDrawerOpen(false);
    router.replace("/auth");
  }

  const displayName = sessionUser?.displayName || sessionUser?.email || "Guest";
  const avatarUrl = sessionUser?.photoUrl;

  return (
    <header className="sticky top-3 z-40 rounded-2xl border border-[var(--line)] bg-[rgba(16,20,58,0.72)] p-3 shadow-[0_8px_28px_rgba(0,0,0,0.32)] backdrop-blur-2xl transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-['Space_Grotesk'] text-lg font-bold tracking-tight text-[var(--ink)] group">
          <span className="brand-mark group-hover:scale-110 transition-transform" />
          <span>StudyOrbit</span>
        </Link>

        {/* Primary Navigation - Desktop (Clean, Un-cramped) */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/dashboard" className={navClass(active === "dashboard")}>
            Dashboard
          </Link>
          <Link href="/documents" className={navClass(active === "documents")}>
            My PDFs
          </Link>
          <Link href="/workspace?module=tasks" className={navClass(active === "tasks")}>
            Tasks
          </Link>
          <Link href="/notifications" className={navClass(active === "notifications")}>
            Reminders
          </Link>
        </nav>

        {/* Right-aligned Icon Cluster & Secondary Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications Icon Button */}
          <Link
            href="/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--card)] text-[var(--ink-dim)] hover:border-[var(--nebula)] hover:text-[var(--ink)] transition-colors"
            title="Notification & Reminder Center"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--gold)] ring-2 ring-[var(--void)]" />
          </Link>

          {/* User Profile / Avatar Dropdown */}
          {sessionUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--card)] p-1 pr-3 text-xs font-semibold text-[var(--ink)] hover:border-[var(--nebula)] transition-all"
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="User avatar"
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full object-cover ring-1 ring-[var(--nebula)]"
                    unoptimized
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(139,127,255,0.2)] text-[var(--nebula)] font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="hidden sm:inline max-w-[7rem] truncate">{displayName}</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-2 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-[var(--line)] mb-1">
                    <p className="text-xs font-bold text-[var(--ink)] truncate">{displayName}</p>
                    <p className="text-[10px] text-[var(--ink-dim)] truncate">{sessionUser.email}</p>
                  </div>

                  <Link
                    href="/profile"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[var(--ink)] hover:bg-[var(--card)] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <UserCircle className="h-4 w-4 text-[var(--nebula)]" /> Profile & Stats
                  </Link>

                  <Link
                    href="/workspace"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[var(--ink)] hover:bg-[var(--card)] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Sparkles className="h-4 w-4 text-[var(--gold)]" /> Workspace Tools
                  </Link>

                  <Link
                    href="/focus"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[var(--ink)] hover:bg-[var(--card)] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Timer className="h-4 w-4 text-[var(--coral)]" /> Focus Timer
                  </Link>

                  <Link
                    href="/relax"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[var(--ink)] hover:bg-[var(--card)] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Headphones className="h-4 w-4 text-[var(--mint)]" /> Relax & Audio
                  </Link>

                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-[var(--coral)] hover:bg-[rgba(255,140,107,0.12)] transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth"
                className="rounded-full border border-[rgba(139,127,255,0.38)] bg-[rgba(139,127,255,0.08)] px-4 py-1.5 text-xs font-semibold text-[var(--ink)] transition-all duration-200 hover:scale-[1.03] hover:border-[var(--nebula)] hover:bg-[rgba(139,127,255,0.16)]"
              >
                Sign in
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen((open) => !open)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] hover:border-[var(--nebula)]"
            aria-label="Toggle navigation menu"
          >
            {mobileDrawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileDrawerOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-[var(--line)] space-y-2 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link
              href="/dashboard"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--card)] p-2.5 text-[var(--ink)] font-medium"
            >
              <LayoutDashboard className="h-4 w-4 text-[var(--nebula)]" /> Dashboard
            </Link>
            <Link
              href="/documents"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--card)] p-2.5 text-[var(--ink)] font-medium"
            >
              <BookOpen className="h-4 w-4 text-[var(--gold)]" /> My PDFs
            </Link>
            <Link
              href="/workspace?module=tasks"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--card)] p-2.5 text-[var(--ink)] font-medium"
            >
              <CheckSquare className="h-4 w-4 text-[var(--coral)]" /> Tasks
            </Link>
            <Link
              href="/notifications"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--card)] p-2.5 text-[var(--ink)] font-medium"
            >
              <Bell className="h-4 w-4 text-[var(--mint)]" /> Reminders
            </Link>
            <Link
              href="/focus"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--card)] p-2.5 text-[var(--ink)] font-medium"
            >
              <Timer className="h-4 w-4 text-[var(--nebula)]" /> Focus Timer
            </Link>
            <Link
              href="/relax"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--card)] p-2.5 text-[var(--ink)] font-medium"
            >
              <Headphones className="h-4 w-4 text-[var(--gold)]" /> Relax & Audio
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

