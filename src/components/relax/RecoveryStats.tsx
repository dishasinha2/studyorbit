"use client";

import { Clock, Coffee, Flame, Zap, Activity } from "lucide-react";

export function RecoveryStats() {
  const recoveryScore = 92;

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6 shadow-lg space-y-5">
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--nebula)]">
            <Activity className="h-3.5 w-3.5" /> SECTION 4 — Focus Recovery Analytics
          </div>
          <h2 className="font-['Space_Grotesk'] text-xl font-bold text-[var(--ink)] mt-1">
            Mindful Rest Metrics
          </h2>
        </div>

        <span className="text-xs font-mono text-[var(--mint)] font-bold bg-[rgba(111,227,193,0.12)] px-3 py-1 rounded-full border border-[rgba(111,227,193,0.3)]">
          Optimal Recovery Zone
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Today's Focus Time */}
        <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-4 flex flex-col justify-between space-y-2">
          <div className="flex items-center gap-2 text-[var(--nebula)]">
            <Clock className="h-4 w-4" />
            <span className="text-[10px] font-mono font-bold uppercase text-[var(--ink-dim)]">Focus Time</span>
          </div>
          <p className="font-['Space_Grotesk'] text-2xl font-black text-[var(--ink)]">2.8 hrs</p>
          <span className="text-[10px] text-[var(--mint)]">↑ +25m vs yesterday</span>
        </div>

        {/* Card 2: Breaks Taken */}
        <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-4 flex flex-col justify-between space-y-2">
          <div className="flex items-center gap-2 text-[var(--gold)]">
            <Coffee className="h-4 w-4" />
            <span className="text-[10px] font-mono font-bold uppercase text-[var(--ink-dim)]">Breaks Taken</span>
          </div>
          <p className="font-['Space_Grotesk'] text-2xl font-black text-[var(--ink)]">4 breaks</p>
          <span className="text-[10px] text-[var(--gold)]">Target: 4-5 breaks</span>
        </div>

        {/* Card 3: Longest Session */}
        <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-4 flex flex-col justify-between space-y-2">
          <div className="flex items-center gap-2 text-[var(--mint)]">
            <Zap className="h-4 w-4" />
            <span className="text-[10px] font-mono font-bold uppercase text-[var(--ink-dim)]">Longest Session</span>
          </div>
          <p className="font-['Space_Grotesk'] text-2xl font-black text-[var(--ink)]">50 mins</p>
          <span className="text-[10px] text-[var(--ink-dim)]">Deep Work block</span>
        </div>

        {/* Card 4: Current Streak */}
        <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-4 flex flex-col justify-between space-y-2">
          <div className="flex items-center gap-2 text-[var(--coral)]">
            <Flame className="h-4 w-4" />
            <span className="text-[10px] font-mono font-bold uppercase text-[var(--ink-dim)]">Streak</span>
          </div>
          <p className="font-['Space_Grotesk'] text-2xl font-black text-[var(--ink)]">5 days</p>
          <span className="text-[10px] text-[var(--coral)]">Daily study habit</span>
        </div>

        {/* Card 5: Recovery Score with Animated SVG Progress Ring */}
        <div className="col-span-2 lg:col-span-1 rounded-xl border border-[rgba(255,200,87,0.3)] bg-[rgba(255,200,87,0.06)] p-4 flex items-center gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
              <path
                className="text-[rgba(255,200,87,0.2)]"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[var(--gold)] transition-all duration-1000 ease-out"
                strokeDasharray={`${recoveryScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute font-['Space_Grotesk'] text-xs font-black text-[var(--ink)]">
              {recoveryScore}%
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-[var(--gold)]">Recovery Score</span>
            <p className="text-xs font-bold text-[var(--ink)]">Fully Refreshed</p>
            <p className="text-[10px] text-[var(--ink-dim)]">Ready for next session</p>
          </div>
        </div>
      </div>
    </div>
  );
}
