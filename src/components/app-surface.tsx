"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { CursorGlow } from "./cursor-glow";
import { InterfaceReveal } from "./interface-reveal";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

type AppSurfaceProps = {
  children: ReactNode;
};

export function AppSurface({ children }: AppSurfaceProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [themePreference, setThemePreference] = useState<"pastel" | "light">("pastel");

  useEffect(() => {
    let alive = true;
    async function loadTheme() {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const res = await fetch("/api/profile", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
      const json = await res?.json().catch(() => null);
      if (!alive || !json?.profile?.preferences?.themePreference) return;
      setThemePreference(json.profile.preferences.themePreference === "light" ? "light" : "pastel");
    }
    void loadTheme();
    return () => {
      alive = false;
    };
  }, [supabase]);

  return (
    <main data-theme={themePreference} className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-8">
      <InterfaceReveal />
      <CursorGlow />
      <div className="surface-ambient-scene" aria-hidden="true">
        <div className="hero-ambient-blob hero-ambient-blob-a" />
        <div className="hero-ambient-blob hero-ambient-blob-b" />
        <div className="hero-ambient-blob hero-ambient-blob-c" />
        <div className="hero-ambient-line hero-ambient-line-a" />
        <div className="hero-ambient-line hero-ambient-line-b" />
      </div>
      <div className="bg-orb orb-d" />
      <div className="bg-orb orb-e" />
      <div className="bg-orb orb-a" />
      <div className="bg-orb orb-b" />
      <div className="bg-orb orb-c" />
      <div className="bg-beam beam-a" />
      <div className="bg-beam beam-b" />
      <div className="bg-beam beam-c" />
      <div className="surface-mesh" />
      <div className="surface-depth-grid" />
      <div className="surface-vignette" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/20 to-transparent" />
      <div className="page-shell relative z-10 animate-[fade-up_0.5s_ease]">{children}</div>
    </main>
  );
}
