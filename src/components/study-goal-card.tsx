"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Timer } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

type GoalData = {
  studyGoalMin: number;
  focusUsedMinutes: number;
};

export function StudyGoalCard() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [goal, setGoal] = useState<GoalData>({ studyGoalMin: 120, focusUsedMinutes: 0 });

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const [profileRes, focusRes] = await Promise.all([
        fetch("/api/profile", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch("/api/focus", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
      ]);
      const profileJson = await profileRes?.json().catch(() => null);
      const focusJson = await focusRes?.json().catch(() => null);
      if (!alive) return;
      setGoal({
        studyGoalMin: profileJson?.profile?.preferences?.studyGoalMin ?? 120,
        focusUsedMinutes: focusJson?.usedMinutes ?? 0,
      });
    }
    void load();
    return () => {
      alive = false;
    };
  }, [supabase]);

  const progress = Math.min(100, Math.round((goal.focusUsedMinutes / Math.max(goal.studyGoalMin, 1)) * 100));

  return (
    <div className="hero-metric">
      <p className="hero-metric-value">Goal</p>
      <p className="hero-metric-label">{goal.focusUsedMinutes}/{goal.studyGoalMin} minutes today</p>
      <div className="mt-4 h-2.5 rounded-full bg-white/70">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-300 via-fuchsia-200 to-sky-200 transition-[width] duration-700" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        {progress >= 100 ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Timer className="h-4 w-4 text-indigo-500" />}
        <span>{progress >= 100 ? "Daily study goal reached" : `${progress}% completed`}</span>
      </div>
    </div>
  );
}
