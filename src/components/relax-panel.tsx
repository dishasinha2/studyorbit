"use client";

import { useEffect, useRef, useState } from "react";
import { AmbientBackground, AmbientSelector, type AmbientTheme } from "@/components/relax/AmbientSelector";
import { BreathingExercise } from "@/components/relax/BreathingExercise";
import { Hero } from "@/components/relax/Hero";
import { MindfulnessPrompts } from "@/components/relax/MindfulnessPrompts";
import { MoodTracker } from "@/components/relax/MoodTracker";
import { MusicPanel } from "@/components/relax/MusicPanel";
import { NatureSounds } from "@/components/relax/NatureSounds";
import { QuoteCard } from "@/components/relax/QuoteCard";

export function RelaxPanel() {
  const breathingRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<AmbientTheme>(() => {
    if (typeof window === "undefined") return "moonlight";
    const savedTheme = window.localStorage.getItem("studyorbit.relax-theme") as AmbientTheme | null;
    return savedTheme && ["nebula", "northern_lights", "deep_space", "moonlight", "rain_window", "animated_stars"].includes(savedTheme) ? savedTheme : "moonlight";
  });

  useEffect(() => {
    window.localStorage.setItem("studyorbit.relax-theme", theme);
  }, [theme]);

  return (
    <div className={`relax-station relax-theme-${theme} mx-auto max-w-6xl`}>
      <AmbientBackground theme={theme} />
      <Hero onScrollToBreathing={() => breathingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })} />

      <div className="relax-section-grid">
        <MoodTracker />
        <AmbientSelector currentTheme={theme} onSelectTheme={setTheme} />
      </div>

      <div ref={breathingRef} className="relax-section-full">
        <BreathingExercise />
      </div>

      <div className="relax-section-full"><NatureSounds /></div>

      <div className="relax-section-grid">
        <MusicPanel />
        <MindfulnessPrompts />
      </div>

      <div className="relax-section-full"><QuoteCard /></div>
    </div>
  );
}
