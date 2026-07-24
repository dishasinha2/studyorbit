"use client";

import { useEffect, useState } from "react";
import { Award, Flame, Trophy } from "lucide-react";
import { authHeaders } from "@/lib/firebase-client";

type Gamification = {
  xpPoints: number;
  currentStreak: number;
  longestStreak: number;
  goalCompletionRate: number;
  achievements: Array<{ code: string; name: string; description: string; xp: number; earnedAt: string }>;
};

export function ProgressDashboardPanel() {
  const [data, setData] = useState<Gamification | null>(null);

  useEffect(() => {
    let active = true;
    async function loadInitial() {
      const headers = await authHeaders();
      if (!headers.Authorization) return;
      const res = await fetch("/api/gamification", { headers });
      const json = await res.json().catch(() => null);
      if (active && res.ok) setData(json.gamification);
    }
    void loadInitial();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="panel shell-frame p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-500">Progress</p>
          <h2 className="mt-2 text-2xl font-black text-slate-700">Streaks, XP, and achievements.</h2>
        </div>
        <span className="chip">{data?.xpPoints ?? 0} XP</span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="soft-card p-4">
          <Flame className="h-5 w-5 text-rose-500" />
          <p className="mt-3 text-3xl font-black text-slate-700">{data?.currentStreak ?? 0}</p>
          <p className="text-xs text-slate-500">Current streak</p>
        </div>
        <div className="soft-card p-4">
          <Trophy className="h-5 w-5 text-amber-500" />
          <p className="mt-3 text-3xl font-black text-slate-700">{data?.longestStreak ?? 0}</p>
          <p className="text-xs text-slate-500">Longest streak</p>
        </div>
        <div className="soft-card p-4">
          <Award className="h-5 w-5 text-emerald-500" />
          <p className="mt-3 text-3xl font-black text-slate-700">{data?.goalCompletionRate ?? 0}%</p>
          <p className="text-xs text-slate-500">Goal completion</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {(data?.achievements ?? []).slice(0, 4).map((achievement) => (
          <div key={achievement.code} className="saved-card">
            <p className="text-sm font-semibold text-slate-700">{achievement.name}</p>
            <p className="mt-1 text-xs text-slate-500">{achievement.description}</p>
            <span className="chip mt-3 text-[10px]">{achievement.xp} XP</span>
          </div>
        ))}
        {data && data.achievements.length === 0 ? <p className="text-sm text-slate-500">Complete a goal or keep a streak to unlock achievements.</p> : null}
      </div>
    </section>
  );
}
