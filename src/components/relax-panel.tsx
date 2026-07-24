"use client";

import { useEffect, useRef, useState } from "react";
import {
  CloudRain,
  Flame,
  Headphones,
  Music2,
  Pause,
  Play,
  Radio,
  Trees,
  Volume2,
  Waves,
} from "lucide-react";

export function RelaxPanel() {
  const [activeTab, setActiveTab] = useState<"spotify" | "lofi" | "nature">("spotify");

  // Web Audio ambient nature sound generators
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [soundVolume, setSoundVolume] = useState(0.5);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Stop nature ambient audio
  const stopNatureSound = () => {
    if (sourceNodeRef.current) {
      try {
        (sourceNodeRef.current as AudioScheduledSourceNode).stop();
      } catch {
        // Ignored
      }
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    setPlayingSound(null);
  };

  // Web Audio synthesis for nature sounds
  const playNatureSound = (soundType: string) => {
    stopNatureSound();

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        void ctx.resume();
      }

      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(soundVolume, ctx.currentTime);

      if (soundType === "rain") {
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1000, ctx.currentTime);
      } else if (soundType === "waves") {
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(400, ctx.currentTime);
        filter.Q.setValueAtTime(1.0, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.12, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(300, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
      } else if (soundType === "forest") {
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        filter.Q.setValueAtTime(2.0, ctx.currentTime);
      } else if (soundType === "fireplace") {
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(600, ctx.currentTime);
      }

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();
      sourceNodeRef.current = whiteNoise;
      gainNodeRef.current = gain;
      setPlayingSound(soundType);
    } catch (err) {
      console.error("Audio synthesis failed", err);
    }
  };

  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(soundVolume, audioCtxRef.current.currentTime);
    }
  }, [soundVolume]);

  useEffect(() => {
    return () => {
      stopNatureSound();
      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
      }
    };
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2 border-b border-[var(--line)] pb-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(139,127,255,0.1)] px-3 py-1 text-xs font-semibold text-[var(--nebula)] border border-[rgba(139,127,255,0.25)]">
          <Headphones className="h-3.5 w-3.5" /> Relax & Study Audio
        </span>
        <h1 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
          Relaxation Station
        </h1>
        <p className="text-xs text-[var(--ink-dim)] max-w-md mx-auto">
          Selected audio environments, study playlists, and nature soundscapes.
        </p>
      </div>

      {/* Minimal Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.03)] p-1 text-xs font-medium text-[var(--ink-dim)]">
          <button
            type="button"
            onClick={() => setActiveTab("spotify")}
            className={`rounded-lg px-4 py-2 transition-all flex items-center gap-2 ${
              activeTab === "spotify"
                ? "bg-[linear-gradient(135deg,var(--nebula),var(--nebula-soft))] text-white font-semibold shadow-[0_2px_10px_rgba(139,127,255,0.3)]"
                : "hover:text-[var(--ink)]"
            }`}
          >
            <Music2 className="h-3.5 w-3.5" /> Spotify Playlist
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("lofi")}
            className={`rounded-lg px-4 py-2 transition-all flex items-center gap-2 ${
              activeTab === "lofi"
                ? "bg-[linear-gradient(135deg,var(--gold),#ffdc93)] text-[var(--void-deep)] font-semibold shadow-[0_2px_10px_rgba(255,200,87,0.3)]"
                : "hover:text-[var(--ink)]"
            }`}
          >
            <Radio className="h-3.5 w-3.5" /> Lofi Playlist
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("nature")}
            className={`rounded-lg px-4 py-2 transition-all flex items-center gap-2 ${
              activeTab === "nature"
                ? "bg-[linear-gradient(135deg,var(--nebula),var(--nebula-soft))] text-white font-semibold shadow-[0_2px_10px_rgba(139,127,255,0.3)]"
                : "hover:text-[var(--ink)]"
            }`}
          >
            <CloudRain className="h-3.5 w-3.5" /> Nature Sounds
          </button>
        </div>
      </div>

      {/* 1. SPOTIFY STUDY PLAYLIST */}
      {activeTab === "spotify" && (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <h2 className="font-['Space_Grotesk'] text-base font-semibold text-[var(--ink)] flex items-center gap-2">
              <Music2 className="h-4 w-4 text-[var(--nebula)]" /> Spotify Study Playlist
            </h2>
            <span className="text-[11px] font-mono text-[var(--gold)]">Deep Focus</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-black/40">
            <iframe
              src="https://open.spotify.com/embed/playlist/37i9dQZF1DX8NTLI29BXZa?utm_source=generator&theme=0"
              width="100%"
              height="380"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="w-full border-0"
              title="Spotify Study Playlist"
            />
          </div>
        </div>
      )}

      {/* 2. LOFI PLAYLIST */}
      {activeTab === "lofi" && (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <h2 className="font-['Space_Grotesk'] text-base font-semibold text-[var(--ink)] flex items-center gap-2">
              <Radio className="h-4 w-4 text-[var(--gold)]" /> Lofi Study Beats
            </h2>
            <span className="text-[11px] font-mono text-[var(--ink-dim)]">Chill Beats</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-black/40">
            <iframe
              src="https://open.spotify.com/embed/playlist/37i9dQZF1DX8Ueb1ThI1S2?utm_source=generator&theme=0"
              width="100%"
              height="380"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="w-full border-0"
              title="Lofi Beats Playlist"
            />
          </div>
        </div>
      )}

      {/* 3. NATURE SOUNDS */}
      {activeTab === "nature" && (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 backdrop-blur-md space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <div>
              <h2 className="font-['Space_Grotesk'] text-base font-semibold text-[var(--ink)] flex items-center gap-2">
                <CloudRain className="h-4 w-4 text-[var(--nebula)]" /> Ambient Nature Soundscapes
              </h2>
              <p className="text-xs text-[var(--ink-dim)] mt-0.5">
                Synthetic Web Audio generators for gentle background sounds.
              </p>
            </div>

            {playingSound && (
              <button
                type="button"
                onClick={stopNatureSound}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition"
              >
                <Pause className="h-3.5 w-3.5" /> Stop Sound
              </button>
            )}
          </div>

          {/* Sound Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Rain */}
            <div
              className={`rounded-xl p-3.5 border transition-all flex items-center justify-between ${
                playingSound === "rain"
                  ? "bg-[rgba(139,127,255,0.15)] border-[var(--nebula)] shadow-[0_0_15px_rgba(139,127,255,0.2)]"
                  : "bg-[rgba(255,255,255,0.03)] border-[var(--line)] hover:border-[rgba(255,255,255,0.2)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(139,127,255,0.2)] text-[var(--nebula)] font-bold">
                  <CloudRain className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[var(--ink)]">Gentle Rain</h3>
                  <p className="text-[10px] text-[var(--ink-dim)]">Soft rainfall ambiance</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => (playingSound === "rain" ? stopNatureSound() : playNatureSound("rain"))}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                  playingSound === "rain"
                    ? "bg-[var(--nebula)] text-white"
                    : "border border-[var(--line)] bg-[rgba(255,255,255,0.05)] text-[var(--ink)] hover:bg-[rgba(255,255,255,0.1)]"
                }`}
              >
                {playingSound === "rain" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
              </button>
            </div>

            {/* Waves */}
            <div
              className={`rounded-xl p-3.5 border transition-all flex items-center justify-between ${
                playingSound === "waves"
                  ? "bg-[rgba(139,127,255,0.15)] border-[var(--nebula)] shadow-[0_0_15px_rgba(139,127,255,0.2)]"
                  : "bg-[rgba(255,255,255,0.03)] border-[var(--line)] hover:border-[rgba(255,255,255,0.2)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(139,127,255,0.2)] text-[var(--nebula)] font-bold">
                  <Waves className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[var(--ink)]">Ocean Waves</h3>
                  <p className="text-[10px] text-[var(--ink-dim)]">Rhythmic wave swells</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => (playingSound === "waves" ? stopNatureSound() : playNatureSound("waves"))}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                  playingSound === "waves"
                    ? "bg-[var(--nebula)] text-white"
                    : "border border-[var(--line)] bg-[rgba(255,255,255,0.05)] text-[var(--ink)] hover:bg-[rgba(255,255,255,0.1)]"
                }`}
              >
                {playingSound === "waves" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
              </button>
            </div>

            {/* Forest */}
            <div
              className={`rounded-xl p-3.5 border transition-all flex items-center justify-between ${
                playingSound === "forest"
                  ? "bg-[rgba(255,200,87,0.15)] border-[var(--gold)] shadow-[0_0_15px_rgba(255,200,87,0.2)]"
                  : "bg-[rgba(255,255,255,0.03)] border-[var(--line)] hover:border-[rgba(255,255,255,0.2)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(255,200,87,0.2)] text-[var(--gold)] font-bold">
                  <Trees className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[var(--ink)]">Forest Breeze</h3>
                  <p className="text-[10px] text-[var(--ink-dim)]">Wind through trees</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => (playingSound === "forest" ? stopNatureSound() : playNatureSound("forest"))}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                  playingSound === "forest"
                    ? "bg-[var(--gold)] text-[var(--void-deep)]"
                    : "border border-[var(--line)] bg-[rgba(255,255,255,0.05)] text-[var(--ink)] hover:bg-[rgba(255,255,255,0.1)]"
                }`}
              >
                {playingSound === "forest" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
              </button>
            </div>

            {/* Fireplace */}
            <div
              className={`rounded-xl p-3.5 border transition-all flex items-center justify-between ${
                playingSound === "fireplace"
                  ? "bg-[rgba(255,200,87,0.15)] border-[var(--gold)] shadow-[0_0_15px_rgba(255,200,87,0.2)]"
                  : "bg-[rgba(255,255,255,0.03)] border-[var(--line)] hover:border-[rgba(255,255,255,0.2)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(255,200,87,0.2)] text-[var(--gold)] font-bold">
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[var(--ink)]">Crackling Fire</h3>
                  <p className="text-[10px] text-[var(--ink-dim)]">Cozy hearth sound</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => (playingSound === "fireplace" ? stopNatureSound() : playNatureSound("fireplace"))}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                  playingSound === "fireplace"
                    ? "bg-[var(--gold)] text-[var(--void-deep)]"
                    : "border border-[var(--line)] bg-[rgba(255,255,255,0.05)] text-[var(--ink)] hover:bg-[rgba(255,255,255,0.1)]"
                }`}
              >
                {playingSound === "fireplace" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
              </button>
            </div>
          </div>

          {/* Volume Control */}
          {playingSound && (
            <div className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.02)] p-3 max-w-sm mx-auto text-xs">
              <Volume2 className="h-4 w-4 text-[var(--ink-dim)]" />
              <span className="font-medium text-[var(--ink-dim)] min-w-[50px]">Volume:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={soundVolume}
                onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                className="w-full accent-[var(--nebula)] cursor-pointer"
              />
              <span className="font-mono text-[var(--ink-dim)] min-w-[32px]">
                {Math.round(soundVolume * 100)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

