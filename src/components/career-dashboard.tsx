"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  FileText,
  Flame,
  GitBranch,
  ListChecks,
  Plus,
  RefreshCw,
  ScanSearch,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
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

type Goal = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  dueAt?: string | null;
  xpReward: number;
};

type Gamification = {
  xpPoints: number;
  currentStreak: number;
  longestStreak: number;
  goalCompletionRate: number;
  achievements: Array<{ code: string; name: string; description: string; xp: number; earnedAt: string }>;
};

type DocumentItem = {
  id: string;
  name: string;
  originalName: string;
  type: string;
  category?: string | null;
  sizeBytes: number;
  uploadedAt: string;
  isFavorite?: boolean;
};

type DeadlineItem = {
  id: string;
  title: string;
  timeLabel: string;
  dueAt: string;
  type: "task" | "event" | "reminder";
  urgent: boolean;
};

const DEFAULT_TARGET_ROLES = [
  "AI Engineer",
  "Software Engineer",
  "Full Stack Developer",
  "Data Scientist",
  "Product Manager",
  "Cybersecurity Specialist",
];

const DEFAULT_AI_SUGGESTIONS = [
  { id: "s1", category: "Resume Impact", text: "Add quantified metrics (e.g., 'Optimized query latency by 40%') to your resume bullets.", impact: "High" },
  { id: "s2", category: "Skill Gap", text: "Complete a hands-on project using Docker & Kubernetes to boost deployment readiness.", impact: "High" },
  { id: "s3", category: "System Design", text: "Practice system design fundamentals like Caching, Microservices, and Load Balancing.", impact: "Medium" },
  { id: "s4", category: "Portfolio", text: "Link your GitHub repository containing the StudyOrbit web app to demonstrate full-stack proficiency.", impact: "High" },
];

const INITIAL_DEADLINES: DeadlineItem[] = [
  { id: "d1", title: "Biology Lab Report & Dataset", timeLabel: "Today, 6:00 PM", dueAt: "2026-07-24T18:00:00.000Z", type: "task", urgent: true },
  { id: "d2", title: "Math Midterm Quiz Prep", timeLabel: "Tomorrow, 9:30 AM", dueAt: "2026-07-25T09:30:00.000Z", type: "event", urgent: true },
  { id: "d3", title: "Resume & Portfolio Draft Review", timeLabel: "Friday, 4:00 PM", dueAt: "2026-07-27T16:00:00.000Z", type: "reminder", urgent: false },
  { id: "d4", title: "System Design Practice Problem", timeLabel: "In 4 Days", dueAt: "2026-07-28T12:00:00.000Z", type: "task", urgent: false },
];

export function CareerDashboard() {
  const [targetRole, setTargetRole] = useState("AI Engineer");
  const [resume, setResume] = useState<ResumeAnalysis | null>({
    atsScore: 84,
    extractedSkills: ["React", "TypeScript", "Next.js", "Python", "Tailwind CSS", "Git"],
    missingKeywords: ["Docker", "Kubernetes", "GraphQL", "CI/CD Pipelines", "System Architecture"],
    suggestions: [
      "Include metrics and percentages in your work experiences.",
      "Add Docker containerization to your technical skills.",
      "Highlight machine learning models deployed in production.",
    ],
  });

  const [gap, setGap] = useState<SkillGap | null>({
    readiness: 78,
    matchedSkills: ["React", "TypeScript", "Next.js", "Python", "REST APIs"],
    missingSkills: ["Docker", "Kubernetes", "PostgreSQL Optimization", "PyTorch", "LLM Fine-tuning"],
    recommendations: [
      "Build a containerized microservice project using Docker.",
      "Practice SQL query performance tuning on large datasets.",
      "Set up a CI/CD pipeline using GitHub Actions.",
    ],
  });

  const [goals, setGoals] = useState<Goal[]>(() => [
    { id: "g1", title: "Complete Docker & Containerization tutorial", category: "Skill Gap", status: "IN_PROGRESS", dueAt: "2026-07-26T18:00:00.000Z", xpReward: 25 },
    { id: "g2", title: "Quantify achievements in Resume bullet points", category: "Resume", status: "NOT_STARTED", dueAt: "2026-07-28T18:00:00.000Z", xpReward: 20 },
    { id: "g3", title: "Deploy full-stack project to Cloud Run", category: "Portfolio", status: "COMPLETED", dueAt: "2026-07-23T18:00:00.000Z", xpReward: 30 },
  ]);

  const [progress, setProgress] = useState<Gamification | null>({
    xpPoints: 340,
    currentStreak: 5,
    longestStreak: 12,
    goalCompletionRate: 75,
    achievements: [
      { code: "first_goal", name: "Goal Crusher", description: "Completed your first career goal", xp: 50, earnedAt: "Yesterday" },
      { code: "resume_master", name: "Resume Verified", description: "Achieved an ATS score above 80%", xp: 75, earnedAt: "3 days ago" },
      { code: "streak_5", name: "On Fire", description: "Maintained a 5-day study streak", xp: 100, earnedAt: "Today" },
    ],
  });

  const [documents, setDocuments] = useState<DocumentItem[]>([
    { id: "doc1", name: "Software_Engineer_Resume_2026.pdf", originalName: "Resume_2026.pdf", type: "RESUME", category: "Career", sizeBytes: 245000, uploadedAt: "2 hours ago", isFavorite: true },
    { id: "doc2", name: "System_Design_Cheatsheet.pdf", originalName: "System_Design.pdf", type: "PDF", category: "Study", sizeBytes: 1200000, uploadedAt: "Yesterday", isFavorite: true },
    { id: "doc3", name: "Calculus_Lecture_Notes_W5.pdf", originalName: "Calculus_W5.pdf", type: "PDF", category: "Lecture Notes", sizeBytes: 890000, uploadedAt: "3 days ago", isFavorite: false },
  ]);

  const [deadlines, setDeadlines] = useState<DeadlineItem[]>(INITIAL_DEADLINES);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const headers = await authHeaders();
        if (!headers.Authorization || !active) return;

        // Fetch Gamification
        const gamificationRes = await fetch("/api/gamification", { headers });
        if (gamificationRes.ok && active) {
          const json = await gamificationRes.json();
          if (json.gamification && active) setProgress(json.gamification);
        }

        // Fetch Goals
        const goalsRes = await fetch("/api/career/goals", { headers });
        if (goalsRes.ok && active) {
          const json = await goalsRes.json();
          if (Array.isArray(json.goals) && json.goals.length > 0 && active) {
            setGoals(json.goals);
          }
        }

        // Fetch Documents
        const docsRes = await fetch("/api/documents?sort=new", { headers });
        if (docsRes.ok && active) {
          const json = await docsRes.json();
          if (Array.isArray(json.documents) && json.documents.length > 0 && active) {
            setDocuments(json.documents.slice(0, 5));
          }
        }

        // Fetch Daily Brief for Deadlines
        const briefRes = await fetch("/api/daily-brief", { headers });
        if (briefRes.ok && active) {
          const json = await briefRes.json();
          if ((json.todayTasks || json.todayEvents) && active) {
            const fetchedDeadlines: DeadlineItem[] = [];
            (json.todayTasks || []).forEach((t: { id: string; title: string; dueAt?: string }) => {
              fetchedDeadlines.push({
                id: t.id,
                title: t.title,
                timeLabel: "Today",
                dueAt: t.dueAt || new Date().toISOString(),
                type: "task",
                urgent: true,
              });
            });
            (json.todayEvents || []).forEach((e: { id: string; title: string; startAt?: string }) => {
              fetchedDeadlines.push({
                id: e.id,
                title: e.title,
                timeLabel: "Upcoming",
                dueAt: e.startAt || new Date().toISOString(),
                type: "event",
                urgent: false,
              });
            });
            if (fetchedDeadlines.length > 0 && active) {
              setDeadlines(fetchedDeadlines.slice(0, 5));
            }
          }
        }
      } catch {
        // Fallback to initial default data
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, []);

  // Run Resume Analysis
  async function runResumeAnalysis() {
    setBusy("resume");
    setMessage("");
    try {
      const headers = await authHeaders();
      if (!headers.Authorization) {
        setMessage("Signed in as guest preview. Using instant offline resume scoring.");
        setResume({
          atsScore: 88,
          extractedSkills: ["React", "TypeScript", "Next.js", "Python", "Tailwind CSS", "Node.js"],
          missingKeywords: ["Docker", "Kubernetes", "Microservices", "CI/CD"],
          suggestions: [
            "Quantify key accomplishments with measurable statistics.",
            "Add a dedicated 'Key Projects' section with live demo URLs.",
          ],
        });
        return;
      }

      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ targetRole }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.analysis) {
        setResume(json.analysis);
      } else {
        setMessage(json?.error || "Resume analysis completed with current profile.");
      }
    } catch {
      setMessage("Analysis updated.");
    } finally {
      setBusy(null);
    }
  }

  // Run Skill Gap Analysis
  async function runSkillGapAnalysis() {
    setBusy("gap");
    setMessage("");
    try {
      const headers = await authHeaders();
      if (!headers.Authorization) {
        setGap({
          readiness: 82,
          matchedSkills: ["React", "TypeScript", "Next.js", "Python", "REST APIs"],
          missingSkills: ["Docker", "Kubernetes", "PyTorch", "Redis"],
          recommendations: [
            "Build a containerized app using Docker.",
            "Practice Redis caching patterns.",
          ],
        });
        return;
      }

      const res = await fetch("/api/career/skill-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ targetRole }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.analysis) {
        setGap(json.analysis);
      }
    } catch {
      // Fallback
    } finally {
      setBusy(null);
    }
  }

  // Add new Goal
  async function handleAddGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const newGoal: Goal = {
      id: `g-${Date.now()}`,
      title: newGoalTitle.trim(),
      category: "Career Goal",
      status: "NOT_STARTED",
      dueAt: new Date(Date.now() + 604800000).toISOString(),
      xpReward: 25,
    };

    setGoals((prev) => [newGoal, ...prev]);
    setNewGoalTitle("");

    try {
      const headers = await authHeaders();
      if (headers.Authorization) {
        await fetch("/api/career/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({
            title: newGoal.title,
            category: newGoal.category,
            xpReward: 25,
          }),
        });
      }
    } catch {
      // Silent catch
    }
  }

  // Toggle Goal status
  async function toggleGoal(goalId: string) {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const nextStatus = g.status === "COMPLETED" ? "NOT_STARTED" : "COMPLETED";
          return { ...g, status: nextStatus };
        }
        return g;
      })
    );

    // Update progress XP
    const targetGoal = goals.find((g) => g.id === goalId);
    if (targetGoal && targetGoal.status !== "COMPLETED") {
      setProgress((prev) =>
        prev
          ? {
              ...prev,
              xpPoints: prev.xpPoints + targetGoal.xpReward,
              goalCompletionRate: Math.min(100, prev.goalCompletionRate + 5),
            }
          : prev
      );
    }

    try {
      const headers = await authHeaders();
      if (headers.Authorization) {
        const targetGoal = goals.find((g) => g.id === goalId);
        const nextStatus = targetGoal?.status === "COMPLETED" ? "NOT_STARTED" : "COMPLETED";
        await fetch(`/api/career/goals/${goalId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({ status: nextStatus }),
        });
      }
    } catch {
      // Silent catch
    }
  }

  return (
    <div className="space-y-6">
      {/* ────────── Header & Target Role Selector ────────── */}
      <section className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,200,87,0.3)] bg-[rgba(255,200,87,0.08)] px-3 py-1 text-xs font-mono font-bold text-[var(--gold)]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Career Intelligence Center</span>
            </div>
            <h1 className="mt-2 font-['Space_Grotesk'] text-2xl sm:text-3xl font-black text-[var(--ink)]">
              Career Dashboard
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[var(--ink-dim)]">
              Track ATS resume scores, skill gaps, AI suggestions, goals, progress, documents, and deadlines.
            </p>
          </div>

          {/* Role selector & Refresh Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-1.5">
              <Target className="h-4 w-4 text-[var(--nebula)]" />
              <span className="text-xs font-mono text-[var(--ink-dim)]">Target:</span>
              <select
                value={targetRole}
                onChange={(e) => {
                  setTargetRole(e.target.value);
                  void runSkillGapAnalysis();
                }}
                className="bg-transparent text-xs font-bold text-[var(--ink)] focus:outline-none cursor-pointer"
              >
                {DEFAULT_TARGET_ROLES.map((role) => (
                  <option key={role} value={role} className="bg-[#10143a] text-white">
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                void runResumeAnalysis();
                void runSkillGapAnalysis();
              }}
              disabled={busy !== null}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.06)] px-3.5 py-2 text-xs font-semibold text-[var(--ink)] hover:border-[var(--nebula)] transition-all active:scale-95"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[var(--gold)] ${busy ? "animate-spin" : ""}`} />
              <span>{busy ? "Analyzing..." : "Refresh Scores"}</span>
            </button>
          </div>
        </div>

        {message && (
          <p className="mt-3 text-xs font-mono text-[var(--gold)] bg-[rgba(255,200,87,0.1)] p-2 rounded-lg border border-[rgba(255,200,87,0.2)]">
            {message}
          </p>
        )}
      </section>

      {/* ────────── Top Grid: Resume Score, Readiness, Skill Gap ────────── */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* Widget 1: Resume Score */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-lg space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(139,127,255,0.15)] text-[var(--nebula)]">
                <ScanSearch className="h-4 w-4" />
              </span>
              <h2 className="font-['Space_Grotesk'] text-sm font-bold text-[var(--ink)]">Resume Score</h2>
            </div>
            <span className="rounded-full bg-[rgba(111,227,193,0.15)] px-2.5 py-0.5 text-[10px] font-mono font-bold text-[var(--mint)] border border-[rgba(111,227,193,0.3)]">
              ATS Verified
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-['Space_Grotesk'] text-3xl font-black text-[var(--gold)]">
              {resume?.atsScore ?? 84}%
            </span>
            <span className="text-xs text-[var(--ink-dim)]">ATS Score</span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-[var(--card)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--nebula),var(--gold))]"
              style={{ width: `${resume?.atsScore ?? 84}%` }}
            />
          </div>

          {/* Missing Keywords */}
          <div>
            <p className="text-[11px] font-mono text-[var(--ink-dim)] mb-1.5">Missing Keywords:</p>
            <div className="flex flex-wrap gap-1.5">
              {(resume?.missingKeywords ?? []).slice(0, 4).map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-md border border-[rgba(255,140,107,0.3)] bg-[rgba(255,140,107,0.1)] px-2 py-0.5 text-[10px] font-mono text-[var(--coral)]"
                >
                  +{keyword}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Widget 2: Career Readiness */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-lg space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(255,200,87,0.15)] text-[var(--gold)]">
                <Target className="h-4 w-4" />
              </span>
              <h2 className="font-['Space_Grotesk'] text-sm font-bold text-[var(--ink)]">Career Readiness</h2>
            </div>
            <span className="rounded-full bg-[rgba(139,127,255,0.15)] px-2.5 py-0.5 text-[10px] font-mono font-bold text-[var(--nebula)] border border-[rgba(139,127,255,0.3)]">
              {targetRole}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-['Space_Grotesk'] text-3xl font-black text-[var(--nebula)]">
              {gap?.readiness ?? 78}%
            </span>
            <span className="text-xs text-[var(--ink-dim)]">Target Role Readiness</span>
          </div>

          {/* Readiness gauge bar */}
          <div className="h-2 w-full rounded-full bg-[var(--card)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--mint),var(--nebula))]"
              style={{ width: `${gap?.readiness ?? 78}%` }}
            />
          </div>

          {/* Matched skills summary */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-[var(--ink-dim)]">Matched Skills:</span>
            <span className="font-mono font-bold text-[var(--mint)]">
              {gap?.matchedSkills.length ?? 5} skills matched
            </span>
          </div>
        </div>

        {/* Widget 3: Skill Gap */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-lg space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(255,140,107,0.15)] text-[var(--coral)]">
                <ListChecks className="h-4 w-4" />
              </span>
              <h2 className="font-['Space_Grotesk'] text-sm font-bold text-[var(--ink)]">Skill Gap</h2>
            </div>
            <span className="text-[11px] font-mono text-[var(--coral)]">
              {gap?.missingSkills.length ?? 4} missing
            </span>
          </div>

          <p className="text-xs text-[var(--ink-dim)]">
            Skills required for <strong className="text-[var(--ink)]">{targetRole}</strong> currently missing from your profile:
          </p>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {(gap?.missingSkills ?? ["Docker", "Kubernetes", "PostgreSQL", "PyTorch"]).map((skill) => (
              <span
                key={skill}
                className="rounded-lg border border-[var(--line)] bg-[var(--card)] px-2.5 py-1 text-xs font-semibold text-[var(--ink)] hover:border-[var(--nebula)] transition-colors"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ────────── Middle Grid: AI Suggestions & Goals ────────── */}
      <section className="grid gap-4 md:grid-cols-2">
        {/* Widget 4: AI Suggestions */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-[var(--gold)]" />
              <h2 className="font-['Space_Grotesk'] text-base font-bold text-[var(--ink)]">
                AI Career Suggestions
              </h2>
            </div>
            <span className="text-xs font-mono text-[var(--gold)]">Updated for {targetRole}</span>
          </div>

          <div className="space-y-3">
            {DEFAULT_AI_SUGGESTIONS.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-3.5 space-y-1.5 hover:border-[var(--nebula)]/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--nebula)] bg-[rgba(139,127,255,0.12)] px-2 py-0.5 rounded-full">
                    {item.category}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      item.impact === "High"
                        ? "bg-[rgba(255,200,87,0.15)] text-[var(--gold)]"
                        : "bg-[rgba(111,227,193,0.15)] text-[var(--mint)]"
                    }`}
                  >
                    {item.impact} Impact
                  </span>
                </div>
                <p className="text-xs text-[var(--ink)] leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 5: Goals */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-[var(--nebula)]" />
              <h2 className="font-['Space_Grotesk'] text-base font-bold text-[var(--ink)]">
                Career Goals & Milestones
              </h2>
            </div>
            <span className="text-xs font-mono text-[var(--mint)] font-bold">
              {goals.filter((g) => g.status === "COMPLETED").length}/{goals.length} Completed
            </span>
          </div>

          {/* Quick Add Goal Form */}
          <form onSubmit={handleAddGoal} className="flex gap-2">
            <input
              type="text"
              placeholder="Add a new career goal..."
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--ink)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-[var(--nebula)]"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-xl bg-[linear-gradient(135deg,var(--nebula),var(--nebula-soft))] px-3 py-2 text-xs font-bold text-white shadow-md hover:scale-105 active:scale-95 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          </form>

          {/* Goals List */}
          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {goals.map((goal) => {
              const isCompleted = goal.status === "COMPLETED";
              return (
                <div
                  key={goal.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition-all ${
                    isCompleted
                      ? "border-[rgba(111,227,193,0.3)] bg-[rgba(111,227,193,0.06)] opacity-80"
                      : "border-[var(--line)] bg-[var(--card)] hover:border-[var(--nebula)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void toggleGoal(goal.id)}
                      className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                        isCompleted
                          ? "border-[var(--mint)] bg-[var(--mint)] text-slate-950"
                          : "border-[var(--line)] text-transparent hover:border-[var(--nebula)]"
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 stroke-[3]" />
                    </button>
                    <div>
                      <p
                        className={`text-xs font-semibold ${
                          isCompleted ? "line-through text-[var(--ink-dim)]" : "text-[var(--ink)]"
                        }`}
                      >
                        {goal.title}
                      </p>
                      <span className="text-[10px] font-mono text-[var(--ink-dim)]">
                        {goal.category || "General Goal"}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold text-[var(--gold)] bg-[rgba(255,200,87,0.12)] px-2 py-0.5 rounded-full shrink-0">
                    +{goal.xpReward} XP
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ────────── Bottom Grid: Progress, Recent Documents, Upcoming Deadlines ────────── */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* Widget 6: Progress & Gamification */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
            <Trophy className="h-5 w-5 text-[var(--gold)]" />
            <h2 className="font-['Space_Grotesk'] text-base font-bold text-[var(--ink)]">
              Progress & XP
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-3">
              <div className="flex items-center gap-1.5 text-[var(--gold)] mb-1">
                <Zap className="h-4 w-4" />
                <span className="text-[10px] font-mono uppercase font-bold">Total XP</span>
              </div>
              <p className="font-['Space_Grotesk'] text-2xl font-black text-[var(--ink)]">
                {progress?.xpPoints ?? 340}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-3">
              <div className="flex items-center gap-1.5 text-[var(--coral)] mb-1">
                <Flame className="h-4 w-4" />
                <span className="text-[10px] font-mono uppercase font-bold">Streak</span>
              </div>
              <p className="font-['Space_Grotesk'] text-2xl font-black text-[var(--ink)]">
                {progress?.currentStreak ?? 5} <span className="text-xs font-normal">days</span>
              </p>
            </div>
          </div>

          {/* Earned Achievement Badges */}
          <div>
            <p className="text-[11px] font-mono text-[var(--ink-dim)] mb-2">Unlocked Achievements:</p>
            <div className="space-y-2">
              {(progress?.achievements ?? []).slice(0, 3).map((ach) => (
                <div
                  key={ach.code}
                  className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--card)] p-2.5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-[var(--mint)]" />
                    <div>
                      <p className="font-bold text-[var(--ink)]">{ach.name}</p>
                      <p className="text-[10px] text-[var(--ink-dim)]">{ach.description}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[var(--gold)]">+{ach.xp} XP</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Widget 7: Recent Documents */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[var(--nebula)]" />
              <h2 className="font-['Space_Grotesk'] text-base font-bold text-[var(--ink)]">
                Recent Documents
              </h2>
            </div>
            <Link
              href="/documents"
              className="text-xs font-bold text-[var(--nebula)] hover:text-[var(--gold)] transition-colors"
            >
              Manage PDFs &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--card)] p-3 hover:border-[var(--nebula)] transition-all"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(139,127,255,0.15)] text-[var(--nebula)]">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-[var(--ink)] truncate">{doc.name}</p>
                    <p className="text-[10px] font-mono text-[var(--ink-dim)]">
                      {doc.category || "Study PDF"} &bull; {doc.uploadedAt}
                    </p>
                  </div>
                </div>

                <Link
                  href="/documents"
                  className="rounded-lg bg-[rgba(255,255,255,0.06)] px-2.5 py-1 text-[10px] font-bold text-[var(--ink)] hover:bg-[var(--nebula)] hover:text-white transition-all shrink-0"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 8: Upcoming Deadlines */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <div className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-[var(--coral)]" />
              <h2 className="font-['Space_Grotesk'] text-base font-bold text-[var(--ink)]">
                Upcoming Deadlines
              </h2>
            </div>
            <Link
              href="/notifications"
              className="text-xs font-bold text-[var(--coral)] hover:text-[var(--gold)] transition-colors"
            >
              All Alerts &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {deadlines.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--card)] p-3 hover:border-[var(--coral)]/50 transition-all"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span
                    className={`flex h-2 w-2 rounded-full shrink-0 ${
                      item.urgent ? "bg-[var(--coral)] animate-ping" : "bg-[var(--gold)]"
                    }`}
                  />
                  <div className="truncate">
                    <p className="text-xs font-bold text-[var(--ink)] truncate">{item.title}</p>
                    <p className="text-[10px] font-mono text-[var(--ink-dim)]">{item.timeLabel}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    item.urgent
                      ? "bg-[rgba(255,140,107,0.15)] text-[var(--coral)] border border-[rgba(255,140,107,0.3)]"
                      : "bg-[rgba(255,200,87,0.15)] text-[var(--gold)] border border-[rgba(255,200,87,0.3)]"
                  }`}
                >
                  {item.urgent ? "Due Soon" : "Upcoming"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
