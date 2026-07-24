"use client";

import { useState } from "react";
import { Music2, Radio, Sparkles, ExternalLink } from "lucide-react";

export function MusicPanel() {
  const [activePlayer, setActivePlayer] = useState<"spotify" | "lofi">("spotify");

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6 shadow-lg space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--nebula)]">
            <Sparkles className="h-3.5 w-3.5" /> SECTION 1 — Relaxation Modes
          </div>
          <h2 className="font-['Space_Grotesk'] text-xl font-bold text-[var(--ink)] mt-1">
            Curated Study Audio & Lofi Streams
          </h2>
        </div>

        {/* Player Switcher */}
        <div className="inline-flex rounded-xl border border-[var(--line)] bg-[var(--card)] p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActivePlayer("spotify")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 transition-all ${
              activePlayer === "spotify"
                ? "bg-[linear-gradient(135deg,var(--nebula),var(--nebula-soft))] text-white shadow-md"
                : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
            }`}
          >
            <Music2 className="h-3.5 w-3.5" /> Spotify Deep Focus
          </button>
          <button
            type="button"
            onClick={() => setActivePlayer("lofi")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 transition-all ${
              activePlayer === "lofi"
                ? "bg-[linear-gradient(135deg,var(--gold),#ffdc93)] text-[var(--void-deep)] shadow-md font-bold"
                : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
            }`}
          >
            <Radio className="h-3.5 w-3.5" /> Lofi Beats
          </button>
        </div>
      </div>

      {/* Cards Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Spotify Deep Focus */}
        <div
          className={`rounded-2xl border p-5 transition-all duration-300 space-y-4 ${
            activePlayer === "spotify"
              ? "border-[var(--nebula)] bg-[rgba(139,127,255,0.06)] shadow-[0_0_24px_rgba(139,127,255,0.15)]"
              : "border-[var(--line)] bg-[var(--card)] opacity-90"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#1DB954,#128C3E)] text-white font-bold shadow-md">
                <Music2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-['Space_Grotesk'] text-base font-bold text-[var(--ink)]">
                  Spotify Deep Focus
                </h3>
                <p className="text-xs text-[var(--ink-dim)]">Ambient instrumental sounds to keep you centered.</p>
              </div>
            </div>

            <a
              href="https://open.spotify.com/playlist/37i9dQZF1DX8NTLI29BXZa"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--ink-dim)] hover:text-[var(--gold)] transition-colors p-1"
              title="Open in Spotify"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <p className="text-xs text-[var(--ink-dim)] leading-relaxed">
            Minimalist synth waves, soft pads, and peaceful tempo shifts engineered for sustained cognitive productivity.
          </p>

          <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-black/50">
            <iframe
              src="https://open.spotify.com/embed/playlist/37i9dQZF1DX8NTLI29BXZa?utm_source=generator&theme=0"
              width="100%"
              height="280"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="w-full border-0"
              title="Spotify Deep Focus Playlist"
            />
          </div>
        </div>

        {/* Card 2: Lofi Beats */}
        <div
          className={`rounded-2xl border p-5 transition-all duration-300 space-y-4 ${
            activePlayer === "lofi"
              ? "border-[var(--gold)] bg-[rgba(255,200,87,0.06)] shadow-[0_0_24px_rgba(255,200,87,0.15)]"
              : "border-[var(--line)] bg-[var(--card)] opacity-90"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--gold),#ff8c6b)] text-[var(--void-deep)] font-bold shadow-md">
                <Radio className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-['Space_Grotesk'] text-base font-bold text-[var(--ink)]">
                  Lofi Chill Beats
                </h3>
                <p className="text-xs text-[var(--ink-dim)]">Smooth hip-hop beats & vintage vinyl warmth.</p>
              </div>
            </div>

            {/* Animated Equalizer Bars */}
            <div className="flex items-end gap-1 h-5 px-2 py-1 bg-[rgba(255,200,87,0.12)] rounded-lg border border-[rgba(255,200,87,0.25)]">
              <span className="w-1 bg-[var(--gold)] h-3 animate-[bounce_1s_infinite_100ms]" />
              <span className="w-1 bg-[var(--gold)] h-5 animate-[bounce_1s_infinite_300ms]" />
              <span className="w-1 bg-[var(--gold)] h-2 animate-[bounce_1s_infinite_200ms]" />
              <span className="w-1 bg-[var(--gold)] h-4 animate-[bounce_1s_infinite_400ms]" />
            </div>
          </div>

          <p className="text-xs text-[var(--ink-dim)] leading-relaxed">
            Relaxing beats to study, chill, or code to. Features low-tempo melodies and relaxing rain backdrop textures.
          </p>

          <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-black/50">
            <iframe
              src="https://open.spotify.com/embed/playlist/37i9dQZF1DX8Ueb1ThI1S2?utm_source=generator&theme=0"
              width="100%"
              height="280"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="w-full border-0"
              title="Lofi Beats Playlist"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
