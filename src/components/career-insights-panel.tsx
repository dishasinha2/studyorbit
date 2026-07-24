"use client";

import { useState } from "react";
import { GitBranch, ListChecks, ScanSearch } from "lucide-react";
import { authHeaders } from "@/lib/firebase-client";

type ResumeAnalysis = {
  atsScore: number;
  extractedSkills: string[];
  missingKeywords: string[];
  suggestions: string[];
};

type SkillGap = {
  readiness: number;
  matchedSkills: string[];
  missingSkills: string[];
  recommendations: string[];
};

type Roadmap = {
  title: string;
  summary: string | null;
  goals: Array<{ id: string; title: string; dueAt: string | null; status: string }>;
};

export function CareerInsightsPanel() {
  const [targetRole, setTargetRole] = useState("AI Engineer");
  const [resume, setResume] = useState<ResumeAnalysis | null>(null);
  const [gap, setGap] = useState<SkillGap | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function post<T>(url: string): Promise<T | null> {
    const headers = await authHeaders();
    if (!headers.Authorization) return null;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ targetRole }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(json?.error ?? "Unable to run analysis.");
      return null;
    }
    setMessage("");
    return json as T;
  }

  async function runResume() {
    setBusy("resume");
    try {
      const json = await post<{ analysis: ResumeAnalysis }>("/api/resume/analyze");
      if (json) setResume(json.analysis);
    } finally {
      setBusy(null);
    }
  }

  async function runGap() {
    setBusy("gap");
    try {
      const json = await post<{ analysis: SkillGap }>("/api/career/skill-gap");
      if (json) setGap(json.analysis);
    } finally {
      setBusy(null);
    }
  }

  async function createRoadmap() {
    setBusy("roadmap");
    try {
      const json = await post<{ roadmap: Roadmap; gap: SkillGap }>("/api/career/roadmaps");
      if (json) {
        setRoadmap(json.roadmap);
        setGap(json.gap);
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="panel shell-frame p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-500">Career Intelligence</p>
          <h2 className="mt-2 text-2xl font-black text-slate-700">Analyze, compare, and plan.</h2>
        </div>
        <input className="input max-w-xs" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <button className="feature-card-strong text-left" disabled={busy !== null} onClick={runResume}>
          <ScanSearch className="h-5 w-5 text-indigo-500" />
          <h2>Resume Analyzer</h2>
          <p>{busy === "resume" ? "Analyzing..." : "ATS score and missing keywords"}</p>
        </button>
        <button className="feature-card-strong text-left" disabled={busy !== null} onClick={runGap}>
          <ListChecks className="h-5 w-5 text-emerald-500" />
          <h2>Skill Gap</h2>
          <p>{busy === "gap" ? "Checking..." : "Current vs target role"}</p>
        </button>
        <button className="feature-card-strong text-left" disabled={busy !== null} onClick={createRoadmap}>
          <GitBranch className="h-5 w-5 text-fuchsia-500" />
          <h2>Roadmap</h2>
          <p>{busy === "roadmap" ? "Creating..." : "Weekly goals and progress"}</p>
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="soft-card p-4">
          <p className="sub-title">Resume</p>
          {resume ? (
            <>
              <p className="mt-2 text-3xl font-black text-slate-700">{resume.atsScore}%</p>
              <p className="text-xs text-slate-500">ATS score</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {resume.missingKeywords.slice(0, 6).map((item) => <span key={item} className="chip text-xs">{item}</span>)}
              </div>
            </>
          ) : <p className="mt-2 text-sm text-slate-500">Upload and ingest a resume first.</p>}
        </div>
        <div className="soft-card p-4">
          <p className="sub-title">Skill gap</p>
          {gap ? (
            <>
              <p className="mt-2 text-3xl font-black text-slate-700">{gap.readiness}%</p>
              <p className="text-xs text-slate-500">Target readiness</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {gap.missingSkills.slice(0, 6).map((item) => <span key={item} className="chip text-xs">{item}</span>)}
              </div>
            </>
          ) : <p className="mt-2 text-sm text-slate-500">Run a skill gap check for your target role.</p>}
        </div>
        <div className="soft-card p-4">
          <p className="sub-title">Roadmap</p>
          {roadmap ? (
            <>
              <p className="mt-2 text-sm font-semibold text-slate-700">{roadmap.title}</p>
              <p className="mt-1 text-xs text-slate-500">{roadmap.summary}</p>
              <p className="mt-3 text-xs text-slate-500">{roadmap.goals.length} goals created</p>
            </>
          ) : <p className="mt-2 text-sm text-slate-500">Generate a roadmap to create progress goals.</p>}
        </div>
      </div>
      {message ? <p className="mt-4 text-xs text-rose-500">{message}</p> : null}
    </section>
  );
}
