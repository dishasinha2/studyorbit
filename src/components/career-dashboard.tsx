"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BrainCircuit, CalendarDays, CheckSquare, Clock3, FileText, Focus, Target } from "lucide-react";
import { authHeaders } from "@/lib/firebase-client";

type Task = { id: string; title: string; dueAt?: string | null; startAt?: string | null; reminderAt?: string | null; status?: string };
type Event = { id: string; title: string; startAt?: string | null; reminderAt?: string | null; dueAt?: string | null };
type Document = { id: string; name: string; category?: string | null; uploadedAt: string };
type Goal = { id: string; title: string; status: string; dueAt?: string | null };
type DashboardData = { summary: { focusMinutes: number; pendingTasks: number; eventsToday: number; overdueTasks: number }; todayTasks: Task[]; todayEvents: Event[]; remindersDue: Event[]; overdueTasks: Task[] };

function EmptyState({ children, href, action }: { children: string; href: string; action: string }) { return <div className="data-empty"><p>{children}</p><Link href={href}>{action} <ArrowRight className="h-3.5 w-3.5" /></Link></div>; }
function dateLabel(value?: string | null) { return value ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "No date"; }

export function CareerDashboard({ mode = "dashboard" }: { mode?: "dashboard" | "career" }) {
  const [brief, setBrief] = useState<DashboardData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    async function load() {
      const headers = await authHeaders();
      if (!headers.Authorization) return;
      const [briefResult, documentsResult, goalsResult] = await Promise.all([fetch("/api/daily-brief", { headers }), fetch("/api/documents?sort=new", { headers }), fetch("/api/career/goals", { headers })]);
      if (!live) return;
      if (briefResult.ok) setBrief(await briefResult.json());
      if (documentsResult.ok) { const json = await documentsResult.json(); setDocuments(Array.isArray(json.documents) ? json.documents.slice(0, 4) : []); }
      if (goalsResult.ok) { const json = await goalsResult.json(); setGoals(Array.isArray(json.goals) ? json.goals : []); }
      setLoading(false);
    }
    void load().catch(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  const heading = mode === "career" ? "Career progress" : "Welcome back";
  const subheading = mode === "career" ? "Goals and progress created from your own workspace." : "A calm view of what needs your attention.";
  const upcoming = [...(brief?.todayEvents ?? []), ...(brief?.remindersDue ?? []), ...(brief?.overdueTasks ?? [])].slice(0, 5);
  const completedGoals = goals.filter((goal) => goal.status === "COMPLETED").length;

  return <div className="dashboard-page"><header className="dashboard-header"><div><p className="dashboard-kicker">Study workspace</p><h2>{heading}</h2><p>{subheading}</p></div><Link href="/workspace?module=dashboard" className="dashboard-quick-action">Open workspace <ArrowRight className="h-4 w-4" /></Link></header>{loading ? <div className="dashboard-loading">Loading your workspace…</div> : <><section className="dashboard-metrics"><article><CheckSquare className="h-4 w-4" /><span>Tasks today</span><strong>{brief?.summary.pendingTasks ?? 0}</strong></article><article><CalendarDays className="h-4 w-4" /><span>Events today</span><strong>{brief?.summary.eventsToday ?? 0}</strong></article><article><Focus className="h-4 w-4" /><span>Focus minutes</span><strong>{brief?.summary.focusMinutes ?? 0}</strong></article><article><Target className="h-4 w-4" /><span>Goals completed</span><strong>{completedGoals}</strong></article></section><section className="dashboard-grid"><article className="dashboard-card"><div className="dashboard-card-head"><h3>Today’s tasks</h3><Link href="/workspace?module=tasks">View all</Link></div>{brief?.todayTasks.length ? <ul className="dashboard-list">{brief.todayTasks.map((task) => <li key={task.id}><CheckSquare className="h-4 w-4" /><span>{task.title}</span><time>{dateLabel(task.dueAt)}</time></li>)}</ul> : <EmptyState href="/workspace?module=tasks" action="Create task">No tasks are due today.</EmptyState>}</article><article className="dashboard-card"><div className="dashboard-card-head"><h3>Upcoming deadlines</h3><Link href="/calendar">Open calendar</Link></div>{upcoming.length ? <ul className="dashboard-list">{upcoming.map((item) => <li key={item.id}><Clock3 className="h-4 w-4" /><span>{item.title}</span><time>{dateLabel(item.startAt ?? item.reminderAt ?? item.dueAt)}</time></li>)}</ul> : <EmptyState href="/calendar" action="Add event">No upcoming deadlines.</EmptyState>}</article><article className="dashboard-card"><div className="dashboard-card-head"><h3>Recent documents</h3><Link href="/documents">All documents</Link></div>{documents.length ? <ul className="dashboard-list">{documents.map((document) => <li key={document.id}><FileText className="h-4 w-4" /><span>{document.name}</span><time>{dateLabel(document.uploadedAt)}</time></li>)}</ul> : <EmptyState href="/documents" action="Upload document">No study material yet.</EmptyState>}</article><article className="dashboard-card"><div className="dashboard-card-head"><h3>Career progress</h3><Link href="/career">View goals</Link></div>{goals.length ? <ul className="dashboard-list">{goals.slice(0, 4).map((goal) => <li key={goal.id}><Target className="h-4 w-4" /><span>{goal.title}</span><time>{goal.status.replaceAll("_", " ")}</time></li>)}</ul> : <EmptyState href="/career" action="Set a goal">No career goals yet.</EmptyState>}</article><article className="dashboard-card dashboard-focus-card"><div className="dashboard-card-head"><h3>Current focus</h3><Link href="/focus">Open focus</Link></div><p>{brief?.summary.focusMinutes ? `${brief.summary.focusMinutes} minutes recorded today.` : "No focus session has been recorded today."}</p><Link href="/focus" className="dashboard-inline-action">Start focus session <ArrowRight className="h-3.5 w-3.5" /></Link></article><article className="dashboard-card dashboard-focus-card"><div className="dashboard-card-head"><h3>AI suggestions</h3><Link href="/ai">Ask AI</Link></div><p>Suggestions appear only after you ask about your own saved material.</p><Link href="/ai" className="dashboard-inline-action"><BrainCircuit className="h-3.5 w-3.5" /> Ask about your study material</Link></article></section></>}</div>;
}
