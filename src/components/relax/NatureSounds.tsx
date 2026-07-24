"use client";

import { useEffect, useRef, useState } from "react";
import { CloudRain, Waves, Trees, Flame, Pause, Play, Volume2, Timer } from "lucide-react";

type SoundType = "rain" | "waves" | "forest" | "fireplace";

interface SoundConfig {
  id: SoundType;
  label: string;
  desc: string;
  icon: React.ElementType;
  color: string;
}

const SOUNDS: SoundConfig[] = [
  { id: "rain", label: "Gentle Rain", desc: "Soothing rainfall backdrop", icon: CloudRain, color: "#8B7FFF" },
  { id: "waves", label: "Ocean Waves", desc: "Rhythmic oceanic swells", icon: Waves, color: "#70A1FF" },
  { id: "forest", label: "Forest Wind", desc: "Peaceful canopy breeze", icon: Trees, color: "#6FE3C1" },
  { id: "fireplace", label: "Crackling Fire", desc: "Cozy warm hearth sounds", icon: Flame, color: "#FFC857" },
];

function generateNoiseBuffer(ctx: AudioContext): AudioBuffer {
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
  return noiseBuffer;
}

export function NatureSounds() {
  const [playingSound, setPlayingSound] = useState<SoundType | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);

  // Stop nature ambient audio
  const stopSound = () => {
    if (lfoRef.current) {
      try {
        lfoRef.current.stop();
      } catch {
        // Ignored
      }
      lfoRef.current.disconnect();
      lfoRef.current = null;
    }

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

  // Play Web Audio nature sound synthesis
  const playSound = (soundType: SoundType) => {
    stopSound();

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        void ctx.resume();
      }

      const noiseBuffer = generateNoiseBuffer(ctx);
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, ctx.currentTime);

      if (soundType === "rain") {
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1200, ctx.currentTime);
      } else if (soundType === "waves") {
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(450, ctx.currentTime);
        filter.Q.setValueAtTime(1.2, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.1, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(350, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
        lfoRef.current = lfo;
      } else if (soundType === "forest") {
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(750, ctx.currentTime);
        filter.Q.setValueAtTime(1.8, ctx.currentTime);
      } else if (soundType === "fireplace") {
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(500, ctx.currentTime);
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

  // Volume handler
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  // Timer Selection Handler
  const handleSelectTimer = (mins: number) => {
    if (timerMinutes === mins) {
      setTimerMinutes(null);
      setSecondsRemaining(null);
    } else {
      setTimerMinutes(mins);
      setSecondsRemaining(mins * 60);
    }
  };

  // Timer Countdown logic
  useEffect(() => {
    if (!timerMinutes || !playingSound) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null || prev <= 1) {
          stopSound();
          setTimerMinutes(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerMinutes, playingSound]);

  useEffect(() => {
    return () => {
      stopSound();
      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
      }
    };
  }, []);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6 shadow-lg space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--mint)]">
            <Trees className="h-3.5 w-3.5" /> 🌿 Built-in Ambient Generators
          </div>
          <h2 className="font-['Space_Grotesk'] text-xl font-bold text-[var(--ink)] mt-1">
            Nature Soundscapes
          </h2>
        </div>

        {playingSound && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--gold)] animate-pulse font-bold">
              ● Playing {SOUNDS.find((s) => s.id === playingSound)?.label}
            </span>
            <button
              type="button"
              onClick={stopSound}
              className="rounded-lg bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition"
            >
              Stop
            </button>
          </div>
        )}
      </div>

      {/* Grid of Nature Sound Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SOUNDS.map((snd) => {
          const Icon = snd.icon;
          const isCurrent = playingSound === snd.id;

          return (
            <div
              key={snd.id}
              className={`rounded-2xl border p-4 flex flex-col justify-between space-y-3 transition-all duration-300 ${
                isCurrent
                  ? "border-[var(--gold)] bg-[rgba(255,200,87,0.1)] shadow-[0_0_20px_rgba(255,200,87,0.2)]"
                  : "border-[var(--line)] bg-[var(--card)] hover:border-[rgba(255,255,255,0.2)]"
              }`}
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl font-bold"
                  style={{ backgroundColor: `${snd.color}20`, color: snd.color }}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {/* Animated Waveform Visualizer */}
                {isCurrent && (
                  <div className="flex items-end gap-1 h-5 px-1.5 py-1 bg-black/40 rounded-md border border-[rgba(255,200,87,0.3)]">
                    <span className="w-1 bg-[var(--gold)] h-4 animate-[bounce_0.8s_infinite_100ms]" />
                    <span className="w-1 bg-[var(--gold)] h-2 animate-[bounce_0.8s_infinite_200ms]" />
                    <span className="w-1 bg-[var(--gold)] h-5 animate-[bounce_0.8s_infinite_300ms]" />
                    <span className="w-1 bg-[var(--gold)] h-3 animate-[bounce_0.8s_infinite_150ms]" />
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-['Space_Grotesk'] text-sm font-bold text-[var(--ink)]">{snd.label}</h3>
                <p className="text-[11px] text-[var(--ink-dim)] mt-0.5">{snd.desc}</p>
              </div>

              <button
                type="button"
                onClick={() => (isCurrent ? stopSound() : playSound(snd.id))}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all ${
                  isCurrent
                    ? "bg-[linear-gradient(135deg,var(--gold),#ffdc93)] text-[var(--void-deep)] shadow-md"
                    : "bg-[rgba(255,255,255,0.06)] text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--nebula)] hover:text-white"
                }`}
              >
                {isCurrent ? (
                  <>
                    <Pause className="h-3.5 w-3.5" /> Pause Sound
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 ml-0.5" /> Play Sound
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Sound Controls & Timer Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-xl border border-[var(--line)] bg-[var(--card)] p-4 text-xs">
        {/* Volume */}
        <div className="flex items-center gap-3 w-full md:w-auto min-w-[240px]">
          <Volume2 className="h-4 w-4 text-[var(--gold)] shrink-0" />
          <span className="font-medium text-[var(--ink-dim)] shrink-0">Volume:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full accent-[var(--gold)] cursor-pointer"
          />
          <span className="font-mono text-[var(--ink)] font-bold shrink-0 min-w-[32px]">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Timers (15, 30, 60 min) */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Timer className="h-4 w-4 text-[var(--nebula)] shrink-0" />
          <span className="font-mono text-[var(--ink-dim)] shrink-0">Timer:</span>
          {[15, 30, 60].map((mins) => {
            const isSelected = timerMinutes === mins;
            return (
              <button
                key={mins}
                type="button"
                onClick={() => handleSelectTimer(mins)}
                className={`rounded-lg px-2.5 py-1 font-mono font-bold transition-all ${
                  isSelected
                    ? "bg-[var(--nebula)] text-white shadow-md"
                    : "bg-[rgba(255,255,255,0.05)] text-[var(--ink-dim)] border border-[var(--line)] hover:text-[var(--ink)]"
                }`}
              >
                {mins}m
              </button>
            );
          })}

          {secondsRemaining !== null && (
            <span className="ml-2 rounded-lg bg-[rgba(255,200,87,0.15)] px-2.5 py-1 font-mono font-bold text-[var(--gold)] border border-[rgba(255,200,87,0.3)]">
              {formatTimer(secondsRemaining)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
