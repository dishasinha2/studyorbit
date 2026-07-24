"use client";

import { useRef, useState } from "react";
import { AppSurface } from "@/components/app-surface";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { AmbientBackground, AmbientSelector, AmbientTheme } from "@/components/relax/AmbientSelector";
import { Hero } from "@/components/relax/Hero";
import { MusicPanel } from "@/components/relax/MusicPanel";
import { NatureSounds } from "@/components/relax/NatureSounds";
import { BreathingExercise } from "@/components/relax/BreathingExercise";
import { MindfulnessPrompts } from "@/components/relax/MindfulnessPrompts";
import { RecoveryStats } from "@/components/relax/RecoveryStats";
import { MoodTracker } from "@/components/relax/MoodTracker";
import { QuoteCard } from "@/components/relax/QuoteCard";
import { StretchGuide } from "@/components/relax/StretchGuide";
import { SessionSummary } from "@/components/relax/SessionSummary";

export default function RelaxPage() {
  const [ambientTheme, setAmbientTheme] = useState<AmbientTheme>("nebula");
  const breathingRef = useRef<HTMLDivElement | null>(null);

  const scrollToBreathing = () => {
    if (breathingRef.current) {
      breathingRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <AppSurface>
      {/* SECTION 8 — Ambient Visuals Background */}
      <AmbientBackground theme={ambientTheme} />

      <section className="relative z-10 mx-auto flex max-w-6xl flex-col gap-6 py-4">
        <SiteNav active="relax" />

        {/* Top Hero with Breathing halo animation */}
        <Hero onScrollToBreathing={scrollToBreathing} />

        {/* SECTION 1 — Relaxation Modes (Spotify & Lofi) */}
        <MusicPanel />

        {/* SECTION 1 — Nature Sounds Generator */}
        <NatureSounds />

        {/* SECTION 2 — Breathing Exercise */}
        <div ref={breathingRef}>
          <BreathingExercise />
        </div>

        {/* SECTION 3 — Mindfulness Prompts */}
        <MindfulnessPrompts />

        {/* SECTION 4 — Focus Recovery Analytics */}
        <RecoveryStats />

        {/* SECTION 5 — Mood Check-In */}
        <MoodTracker />

        {/* SECTION 6 — Quote Generator */}
        <QuoteCard />

        {/* SECTION 7 — Mini Stretch Guide */}
        <StretchGuide />

        {/* SECTION 8 — Ambient Visuals Selector */}
        <AmbientSelector currentTheme={ambientTheme} onSelectTheme={setAmbientTheme} />

        {/* SECTION 9 — Session Summary */}
        <SessionSummary />

        <SiteFooter />
      </section>
    </AppSurface>
  );
}
