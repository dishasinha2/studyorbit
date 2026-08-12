"use client";

import { Sparkles, Compass, Moon, CloudRain, Star, Sun } from "lucide-react";

export type AmbientTheme = "nebula" | "northern_lights" | "deep_space" | "moonlight" | "rain_window" | "animated_stars";

export const AMBIENT_THEMES: { id: AmbientTheme; label: string; icon: React.ElementType; color: string; desc: string }[] = [
  { id: "nebula", label: "Nebula", icon: Sparkles, color: "#8B7FFF", desc: "Cosmic purple aura" },
  { id: "northern_lights", label: "Northern Lights", icon: Compass, color: "#6FE3C1", desc: "Aurora borealis green" },
  { id: "deep_space", label: "Deep Space", icon: Star, color: "#10143A", desc: "Inky infinite dark" },
  { id: "moonlight", label: "Moonlight", icon: Moon, color: "#FFC857", desc: "Gentle golden glow" },
  { id: "rain_window", label: "Rain Window", icon: CloudRain, color: "#70A1FF", desc: "Calm misty atmosphere" },
  { id: "animated_stars", label: "Animated Stars", icon: Sun, color: "#E0C3FC", desc: "Twinkling starfield" },
];

interface AmbientSelectorProps {
  currentTheme: AmbientTheme;
  onSelectTheme: (theme: AmbientTheme) => void;
}

export function AmbientSelector({ currentTheme, onSelectTheme }: AmbientSelectorProps) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5 shadow-lg space-y-3">
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--gold)]" />
          <h3 className="font-['Space_Grotesk'] text-sm font-bold text-[var(--ink)]">
            Ambient Visuals & Atmosphere
          </h3>
        </div>
        <span className="text-[11px] font-mono text-[var(--gold)] font-medium">SECTION 8</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {AMBIENT_THEMES.map((theme) => {
          const Icon = theme.icon;
          const isActive = currentTheme === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onSelectTheme(theme.id)}
              className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all duration-300 ${
                isActive
                  ? "border-[var(--gold)] bg-[rgba(255,200,87,0.12)] shadow-[0_0_20px_rgba(255,200,87,0.2)] scale-[1.02]"
                  : "border-[var(--line)] bg-[var(--card)] hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.04)]"
              }`}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg mb-2 transition-transform"
                style={{ backgroundColor: `${theme.color}20`, color: theme.color }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-[var(--ink)]">{theme.label}</span>
              <span className="text-[10px] text-[var(--ink-dim)] mt-0.5 line-clamp-1">{theme.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AmbientBackground({ theme }: { theme: AmbientTheme }) {
  return (
    <div className={`ambient-background ambient-background-${theme}`} aria-hidden="true">
      <i /><i /><i /><i /><i /><i />
    </div>
  );
  /*switch (theme) {
    case "northern_lights":
      return (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(111,227,193,0.18)_0%,transparent_70%)] blur-3xl animate-pulse" />
          <div className="absolute top-1/3 right-10 h-[400px] w-[400px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,210,255,0.12)_0%,transparent_70%)] blur-3xl" />
        </div>
      );
    case "moonlight":
      return (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-20 right-1/4 h-[600px] w-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,200,87,0.15)_0%,transparent_70%)] blur-3xl" />
        </div>
      );
    case "rain_window":
      return (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(112,161,255,0.12)_0%,transparent_60%)]">
          <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[radial-gradient(#70a1ff_1px,transparent_1px)] [background-size:24px_24px]" />
        </div>
      );
    case "deep_space":
      return (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#030612]/80">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,127,255,0.08)_0%,transparent_70%)] blur-3xl" />
        </div>
      );
    case "animated_stars":
      return (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute top-10 left-10 h-2 w-2 rounded-full bg-white/80 animate-ping" />
          <div className="absolute top-1/4 right-1/3 h-1.5 w-1.5 rounded-full bg-[var(--gold)] animate-pulse" />
          <div className="absolute bottom-1/3 left-1/5 h-2 w-2 rounded-full bg-[var(--nebula)] animate-pulse" />
          <div className="absolute top-1/2 right-10 h-1 w-1 rounded-full bg-white animate-ping" />
        </div>
      );
    case "nebula":
    default:
      return (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 h-[500px] w-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,127,255,0.2)_0%,transparent_70%)] blur-3xl" />
          <div className="absolute top-1/3 -right-20 h-[450px] w-[450px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,200,87,0.15)_0%,transparent_70%)] blur-3xl" />
        </div>
      );
  }*/
}
