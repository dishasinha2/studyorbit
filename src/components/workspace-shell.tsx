"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { AlarmClock, AlertTriangle, CalendarCheck, CheckCircle2, ChevronDown, ChevronRight, Clock3, Command, Expand, ExternalLink, FileStack, FolderOpen, Highlighter, Layers3, Lightbulb, Link2, Lock, PenSquare, Pin, Plus, Search, Timer, Trash2, Underline, UserCircle2, Youtube, Zap } from "lucide-react";
import { clearBrowserSession, persistBrowserSession } from "@/lib/auth-cookie";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { AuthPanel } from "@/components/auth-panel";
import type { Artifact, FileItem, FocusSession, PlannerEvent, StickyNote, VideoBookmark, Whiteboard } from "@/lib/types";
import type { WorkspaceModuleId } from "@/lib/workspace-config";
import {
  createDemoUserId,
  firstUrl,
  readDemoEmail,
  renderHighlightedText,
  renderRichNoteText,
  taskStatusChipClass,
  taskStatusLabel,
  taskStatusOf,
  timeUntilLabel,
  toLabel,
} from "@/lib/workspace-utils";

type DailyBrief = {
  summary: {
    eventsToday: number;
    pendingTasks: number;
    remindersDue: number;
    overdueTasks: number;
    pinnedNotes: number;
    notesSaved: number;
    focusMinutes: number;
  };
  todayEvents: PlannerEvent[];
  todayTasks: Artifact[];
  remindersDue: PlannerEvent[];
  pinnedSticky: StickyNote[];
  recentNotes: Artifact[];
};

type SearchResult = { id: string; kind: string; title: string; preview: string };
type CommandItem = { id: string; label: string; hint: string; keywords: string; run: () => void };
type TimelineItem = { id: string; type: "event" | "reminder" | "task"; title: string; at: string | null; isDone?: boolean; status?: string };
type PlannerInsight = { id: string; level: "info" | "warn" | "good"; title: string; detail: string };

const cardMotion = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } };
type BoardPoint = { x: number; y: number };
type BoardStroke = { color: string; size: number; points: BoardPoint[] };

type CollapsibleCardProps = {
  id?: string;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  right?: ReactNode;
};

function CollapsibleCard({ id, title, icon, children, defaultOpen = true, right }: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <motion.section id={id} {...cardMotion} className="panel p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="title-sm mb-0 inline-flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <div className="hidden md:block">{right}</div>
        <button className="btn-secondary px-3 py-1 text-xs md:hidden" onClick={() => setOpen((value) => !value)}>
          {open ? "Hide" : "Show"} <ChevronDown className={`ml-1 inline h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      <div className={`${open ? "block" : "hidden"} mt-3 md:block`}>{children}</div>
    </motion.section>
  );
}

type WorkspaceShellProps = {
  activeModule?: WorkspaceModuleId;
  onCountsChange?: (counts: Partial<Record<WorkspaceModuleId, number>>) => void;
};

type ModuleLoadingState = {
  brief: boolean;
  events: boolean;
  stickies: boolean;
  focus: boolean;
  notes: boolean;
  tasks: boolean;
  links: boolean;
  boards: boolean;
  videos: boolean;
  files: boolean;
  search: boolean;
};

type ProfilePreferences = {
  themePreference: "pastel" | "light";
  studyGoalMin: number;
  focusSessionMin: number;
};

export function WorkspaceShell({ activeModule = "all", onCountsChange }: WorkspaceShellProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [demoUserId, setDemoUserId] = useState<string | null>(null);

  const [dailyBrief, setDailyBrief] = useState<DailyBrief | null>(null);
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [stickies, setStickies] = useState<StickyNote[]>([]);
  const [notes, setNotes] = useState<Artifact[]>([]);
  const [studyTasks, setStudyTasks] = useState<Artifact[]>([]);
  const [studyLinks, setStudyLinks] = useState<Artifact[]>([]);
  const [boards, setBoards] = useState<Whiteboard[]>([]);
  const [videos, setVideos] = useState<VideoBookmark[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [focusUsedMinutes, setFocusUsedMinutes] = useState(0);
  const [profilePrefs, setProfilePrefs] = useState<ProfilePreferences>({
    themePreference: "pastel",
    studyGoalMin: 120,
    focusSessionMin: 25,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchKind, setSearchKind] = useState("all");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchCounts, setSearchCounts] = useState<Record<string, number>>({ all: 0 });
  const [searchLoading, setSearchLoading] = useState(false);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [moduleLoading, setModuleLoading] = useState<ModuleLoadingState>({
    brief: false,
    events: false,
    stickies: false,
    focus: false,
    notes: false,
    tasks: false,
    links: false,
    boards: false,
    videos: false,
    files: false,
    search: false,
  });

  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [quickTaskDue, setQuickTaskDue] = useState("");
  const [captureType, setCaptureType] = useState<"TASK" | "NOTE" | "LINK">("TASK");
  const [captureTitle, setCaptureTitle] = useState("");
  const [captureBody, setCaptureBody] = useState("");
  const [captureUrl, setCaptureUrl] = useState("");
  const [captureDueAt, setCaptureDueAt] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventReminder, setEventReminder] = useState("");
  const [stickyContent, setStickyContent] = useState("");
  const [stickyColor, setStickyColor] = useState("#fef08a");
  const [stickyFilter, setStickyFilter] = useState<"all" | "pinned" | "study">("all");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDueAt, setLinkDueAt] = useState("");
  const [linkNote, setLinkNote] = useState("");
  const [linkContext, setLinkContext] = useState("Study");
  const [resourceType, setResourceType] = useState<"GPT" | "YOUTUBE" | "SPOTIFY" | "ARTICLE">("GPT");
  const [studyTitle, setStudyTitle] = useState("");
  const [studySubject, setStudySubject] = useState("General");
  const [studyDueAt, setStudyDueAt] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoComment, setVideoComment] = useState("");
  const [videoTags, setVideoTags] = useState("");
  const [fileName, setFileName] = useState("");
  const [filePath, setFilePath] = useState("");
  const [fileCategory, setFileCategory] = useState("");
  const [fileSubject, setFileSubject] = useState("");
  const [fileTags, setFileTags] = useState("");
  const [fileLastPosition, setFileLastPosition] = useState("");
  const [fileProgressNote, setFileProgressNote] = useState("");
  const [fileSort, setFileSort] = useState<"new" | "old" | "az" | "za">("new");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileNotice, setFileNotice] = useState<string | null>(null);
  const [videoView, setVideoView] = useState<"all" | "pending" | "completed">("all");
  const [taskStatusFilter, setTaskStatusFilter] = useState<"all" | "pending" | "in-progress" | "completed">("all");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteContext, setNoteContext] = useState("Personal");
  const [noteFilter, setNoteFilter] = useState("");
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [boardEditorOpen, setBoardEditorOpen] = useState(false);
  const quickTaskInputRef = useRef<HTMLInputElement | null>(null);
  const noteTitleInputRef = useRef<HTMLInputElement | null>(null);
  const videoTitleInputRef = useRef<HTMLInputElement | null>(null);
  const fileNameInputRef = useRef<HTMLInputElement | null>(null);
  const noteInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [boardTitle, setBoardTitle] = useState("Daily Whiteboard");
  const [brushColor, setBrushColor] = useState("#0f172a");
  const [brushSize, setBrushSize] = useState(3);
  const [strokes, setStrokes] = useState<BoardStroke[]>([]);
  const [activeStroke, setActiveStroke] = useState<BoardStroke | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [pomodoroMin, setPomodoroMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [screenLimitMin, setScreenLimitMin] = useState(180);
  const [blockedSites, setBlockedSites] = useState("youtube.com, instagram.com, x.com");
  const [focusLockMin, setFocusLockMin] = useState(25);
  const [focusMode, setFocusMode] = useState(false);
  const [focusLockUntil, setFocusLockUntil] = useState<string | null>(null);
  const [focusWarning, setFocusWarning] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [timerPhase, setTimerPhase] = useState<"work" | "break">("work");
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [workStartedAt, setWorkStartedAt] = useState<string | null>(null);

  const authHeaders = useMemo<Record<string, string>>(() => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (!token && demoUserId) headers["x-user-id"] = demoUserId;
    return headers;
  }, [token, demoUserId]);

  const focusLimitReached = focusUsedMinutes >= screenLimitMin;
  const blockedHosts = useMemo(
    () => blockedSites.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean),
    [blockedSites],
  );
  const focusLockRemainingSec = useMemo(() => {
    if (!focusLockUntil) return 0;
    const ms = new Date(focusLockUntil).getTime() - nowTs;
    return ms > 0 ? Math.ceil(ms / 1000) : 0;
  }, [focusLockUntil, nowTs]);
  const studyMetrics = useMemo(() => {
    const studyOnly = studyTasks.filter((task) => (task.contextKey ?? "").toLowerCase().includes("study/"));
    const completedTasks = studyOnly.filter((task) => taskStatusOf(task) === "COMPLETED").length;
    const totalTasks = studyOnly.length;
    const completedVideos = videos.filter((video) => video.isCompleted).length;
    const totalVideos = videos.length;
    const pctTasks = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const pctVideos = totalVideos ? Math.round((completedVideos / totalVideos) * 100) : 0;
    return { completedTasks, totalTasks, completedVideos, totalVideos, pctTasks, pctVideos };
  }, [studyTasks, videos]);
  const studyGoalProgress = useMemo(
    () => Math.min(100, Math.round((focusUsedMinutes / Math.max(profilePrefs.studyGoalMin, 1)) * 100)),
    [focusUsedMinutes, profilePrefs.studyGoalMin],
  );
  const studyStreak = useMemo(() => {
    if (!focusSessions.length) return { days: 0, lastDay: null as string | null };
    const daySet = new Set(
      focusSessions.map((session) => {
        const d = new Date(session.startedAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      }),
    );
    const days = [...daySet].sort((a, b) => b - a);
    if (!days.length) return { days: 0, lastDay: null as string | null };

    let streak = 1;
    let cursor = days[0];
    for (let i = 1; i < days.length; i += 1) {
      const expected = cursor - 24 * 60 * 60 * 1000;
      if (days[i] !== expected) break;
      streak += 1;
      cursor = days[i];
    }

    return { days: streak, lastDay: new Date(days[0]).toISOString() };
  }, [focusSessions]);
  const nowDate = useMemo(() => new Date(nowTs), [nowTs]);
  const greeting = useMemo(() => {
    const hour = nowDate.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, [nowDate]);
  const todayTimeline = useMemo<TimelineItem[]>(() => {
    const eventItems = events
      .filter((item) => !item.isDone)
      .map((item) => ({ id: item.id, type: "event" as const, title: item.title, at: item.startAt }));
    const reminderItems = (dailyBrief?.remindersDue ?? []).map((item) => ({
      id: `r-${item.id}`,
      type: "reminder" as const,
      title: item.title,
      at: item.reminderAt,
    }));
    const taskItems = (dailyBrief?.todayTasks ?? []).map((item) => ({
      id: `t-${item.id}`,
      type: "task" as const,
      title: item.title,
      at: item.dueAt,
      isDone: taskStatusOf(item) === "COMPLETED",
      status: taskStatusOf(item),
    }));
    return [...eventItems, ...reminderItems, ...taskItems].sort((a, b) => {
      if (!a.at && !b.at) return 0;
      if (!a.at) return 1;
      if (!b.at) return -1;
      return new Date(a.at).getTime() - new Date(b.at).getTime();
    });
  }, [events, dailyBrief]);
  const filteredTodayTasks = useMemo(() => {
    const tasks = dailyBrief?.todayTasks ?? [];
    if (taskStatusFilter === "pending") return tasks.filter((task) => taskStatusOf(task) === "PENDING");
    if (taskStatusFilter === "in-progress") return tasks.filter((task) => taskStatusOf(task) === "IN_PROGRESS");
    if (taskStatusFilter === "completed") return tasks.filter((task) => taskStatusOf(task) === "COMPLETED");
    return tasks;
  }, [dailyBrief, taskStatusFilter]);
  const filteredStudyTasks = useMemo(() => {
    if (taskStatusFilter === "pending") return studyTasks.filter((task) => taskStatusOf(task) === "PENDING");
    if (taskStatusFilter === "in-progress") return studyTasks.filter((task) => taskStatusOf(task) === "IN_PROGRESS");
    if (taskStatusFilter === "completed") return studyTasks.filter((task) => taskStatusOf(task) === "COMPLETED");
    return studyTasks;
  }, [studyTasks, taskStatusFilter]);
  const nextUp = useMemo(() => {
    const future = todayTimeline.find((item) => item.at && new Date(item.at).getTime() >= nowTs);
    return future ?? null;
  }, [todayTimeline, nowTs]);
  const segmentCounts = useMemo(() => {
    const result = { morning: 0, afternoon: 0, evening: 0 };
    todayTimeline.forEach((item) => {
      if (!item.at) return;
      const h = new Date(item.at).getHours();
      if (h < 12) result.morning += 1;
      else if (h < 17) result.afternoon += 1;
      else result.evening += 1;
    });
    return result;
  }, [todayTimeline]);
  const plannerInsights = useMemo<PlannerInsight[]>(() => {
    const insights: PlannerInsight[] = [];
    const now = new Date(nowTs);
    const dayEnd = new Date(now);
    dayEnd.setHours(22, 0, 0, 0);

    const blocks = [
      ...events
        .filter((item) => !item.isDone)
        .map((item) => {
          const start = new Date(item.startAt).getTime();
          const end = item.endAt ? new Date(item.endAt).getTime() : start + 45 * 60 * 1000;
          return { start, end };
        }),
      ...(dailyBrief?.remindersDue ?? [])
        .filter((item) => item.reminderAt)
        .map((item) => {
          const start = new Date(item.reminderAt as string).getTime();
          return { start, end: start + 10 * 60 * 1000 };
        }),
      ...(dailyBrief?.todayTasks ?? [])
        .filter((item) => item.dueAt)
        .map((item) => {
          const start = new Date(item.dueAt as string).getTime();
          return { start, end: start + 20 * 60 * 1000 };
        }),
    ]
      .filter((b) => b.end > nowTs)
      .sort((a, b) => a.start - b.start);

    let cursor = nowTs;
    let bestGapStart = -1;
    let bestGapMin = 0;
    for (const block of blocks) {
      if (block.start > cursor) {
        const gapMin = Math.floor((block.start - cursor) / 60000);
        if (gapMin > bestGapMin) {
          bestGapMin = gapMin;
          bestGapStart = cursor;
        }
      }
      cursor = Math.max(cursor, block.end);
    }
    if (dayEnd.getTime() > cursor) {
      const gapMin = Math.floor((dayEnd.getTime() - cursor) / 60000);
      if (gapMin > bestGapMin) {
        bestGapMin = gapMin;
        bestGapStart = cursor;
      }
    }

    if (bestGapMin >= 50 && bestGapStart > 0) {
      insights.push({
        id: "deep-work",
        level: "good",
        title: "Best deep-work slot found",
        detail: `${new Date(bestGapStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (${bestGapMin} min available)`,
      });
    } else {
      insights.push({
        id: "tight-day",
        level: "warn",
        title: "Day looks fragmented",
        detail: "No 50+ minute focus slot detected. Reschedule one low-priority item.",
      });
    }

    if (segmentCounts.afternoon >= 5) {
      insights.push({
        id: "overloaded-afternoon",
        level: "warn",
        title: "Afternoon overload risk",
        detail: `${segmentCounts.afternoon} items are stacked in afternoon. Move one to evening or tomorrow.`,
      });
    }

    if ((dailyBrief?.summary.overdueTasks ?? 0) > 0) {
      insights.push({
        id: "overdue-tasks",
        level: "warn",
        title: "Overdue tasks pending",
        detail: `${dailyBrief?.summary.overdueTasks ?? 0} tasks are overdue. Clear at least 1 before new work.`,
      });
    }

    if (focusUsedMinutes < 25 && now.getHours() >= 14) {
      insights.push({
        id: "focus-streak",
        level: "info",
        title: "Focus streak suggestion",
        detail: "Start one 25-minute session now to protect your execution time.",
      });
    }

    if (nextUp?.at) {
      const min = Math.floor((new Date(nextUp.at).getTime() - nowTs) / 60000);
      if (min >= 0 && min <= 15) {
        insights.push({
          id: "next-up-prep",
          level: "info",
          title: "Prep for next item",
          detail: `"${nextUp.title}" starts in ${Math.max(1, min)} min. Wrap current context now.`,
        });
      }
    }

    return insights.slice(0, 6);
  }, [events, dailyBrief, segmentCounts, focusUsedMinutes, nextUp, nowTs]);

  const sortedFiles = useMemo(() => {
    const list = [...files];
    if (fileSort === "old") return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (fileSort === "az") return list.sort((a, b) => a.name.localeCompare(b.name));
    if (fileSort === "za") return list.sort((a, b) => b.name.localeCompare(a.name));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [files, fileSort]);

  const filteredVideos = useMemo(() => {
    if (videoView === "pending") return videos.filter((item) => !item.isCompleted);
    if (videoView === "completed") return videos.filter((item) => item.isCompleted);
    return videos;
  }, [videos, videoView]);
  const filteredNotes = useMemo(() => {
    const q = noteFilter.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((note) =>
      `${note.title} ${note.content} ${note.contextKey ?? ""}`.toLowerCase().includes(q),
    );
  }, [notes, noteFilter]);
  const noteContextGroups = useMemo(() => {
    const groups = new Map<string, number>();
    filteredNotes.forEach((note) => {
      const key = (note.contextKey?.trim() || "General").split("/").pop() || "General";
      groups.set(key, (groups.get(key) ?? 0) + 1);
    });
    return [...groups.entries()].sort((a, b) => b[1] - a[1]);
  }, [filteredNotes]);
  const filteredStickies = useMemo(() => {
    if (stickyFilter === "pinned") return stickies.filter((note) => note.isPinned);
    if (stickyFilter === "study") {
      return stickies.filter((note) =>
        ["revision", "exam", "doubt", "assignment", "study"].some((word) => note.content.toLowerCase().includes(word)),
      );
    }
    return stickies;
  }, [stickies, stickyFilter]);
  const fileSubjectGroups = useMemo(() => {
    const groups = new Map<string, { count: number; completed: number }>();
    files.forEach((file) => {
      const key = file.subject?.trim() || "General";
      const current = groups.get(key) ?? { count: 0, completed: 0 };
      current.count += 1;
      if (file.isCompleted) current.completed += 1;
      groups.set(key, current);
    });
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [files]);
  const priorityItems = useMemo(() => {
    const overdue = studyTasks
      .filter((task) => taskStatusOf(task) !== "COMPLETED" && task.dueAt && new Date(task.dueAt).getTime() < nowTs)
      .slice(0, 3)
      .map((task) => ({ id: task.id, label: task.title, kind: "task" as const }));
    const pinned = stickies
      .filter((note) => note.isPinned)
      .slice(0, 3)
      .map((note) => ({ id: note.id, label: note.content, kind: "sticky" as const }));
    return [...overdue, ...pinned].slice(0, 6);
  }, [studyTasks, stickies, nowTs]);
  const showAllModules = activeModule === "all";
  const showModule = useCallback((id: string) => showAllModules || activeModule === id, [showAllModules, activeModule]);
  const showOverview = showAllModules;
  const moduleNeeds = useMemo(() => ({
    brief: showAllModules || activeModule === "dashboard" || activeModule === "timeline" || activeModule === "planner-insights",
    events: showAllModules || activeModule === "dashboard" || activeModule === "timeline" || activeModule === "planner-insights",
    stickies: showAllModules || activeModule === "dashboard",
    focus: showAllModules || activeModule === "dashboard" || activeModule === "focus-lab",
    notes: showAllModules || activeModule === "dashboard" || activeModule === "notes",
    tasks: showAllModules || activeModule === "dashboard" || activeModule === "study-organizer" || activeModule === "timeline" || activeModule === "planner-insights",
    links: showAllModules || activeModule === "study-links",
    boards: showAllModules || activeModule === "notes",
    videos: showAllModules || activeModule === "dashboard" || activeModule === "videos",
    files: showAllModules || activeModule === "dashboard" || activeModule === "files",
    search: showAllModules || activeModule === "search",
  }), [showAllModules, activeModule]);

  function jumpTo(id: string) {
    const node = document.getElementById(id);
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const refreshAuth = useCallback(async () => {
    if (!supabase) {
      setDemoMode(true);
      setDemoUserId(createDemoUserId());
      setToken(null);
      setEmail(readDemoEmail());
      setReady(true);
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      persistBrowserSession(data.session.access_token, data.session.refresh_token);
      setDemoMode(false);
      setDemoUserId(null);
      setToken(data.session.access_token);
      setEmail(data.session.user?.email);
    } else {
      clearBrowserSession();
      setDemoMode(false);
      setDemoUserId(null);
      setToken(null);
      setEmail(undefined);
    }
    setReady(true);
  }, [supabase]);

  const fetchJson = useCallback(async (url: string, init?: RequestInit) => {
    try {
      const res = await fetch(url, init);
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setFocusWarning(payload?.error ?? `Request failed: ${res.status}`);
        return null;
      }
      return res.json();
    } catch (error) {
      setFocusWarning(error instanceof Error ? error.message : "Network request failed.");
      return null;
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!Object.keys(authHeaders).length) return;
    setModuleLoading((prev) => ({
      ...prev,
      brief: moduleNeeds.brief,
      events: moduleNeeds.events,
      stickies: moduleNeeds.stickies,
      focus: moduleNeeds.focus,
      notes: moduleNeeds.notes,
      tasks: moduleNeeds.tasks,
      links: moduleNeeds.links,
      boards: moduleNeeds.boards,
      videos: moduleNeeds.videos,
      files: moduleNeeds.files,
    }));
    const [brief, e, s, f, n, t, l, b, v, fi, p] = await Promise.all([
      moduleNeeds.brief ? fetchJson("/api/daily-brief", { headers: authHeaders }) : Promise.resolve(undefined),
      moduleNeeds.events ? fetchJson("/api/events", { headers: authHeaders }) : Promise.resolve(undefined),
      moduleNeeds.stickies ? fetchJson("/api/sticky", { headers: authHeaders }) : Promise.resolve(undefined),
      moduleNeeds.focus ? fetchJson("/api/focus", { headers: authHeaders }) : Promise.resolve(undefined),
      moduleNeeds.notes ? fetchJson("/api/artifacts?type=NOTE", { headers: authHeaders }) : Promise.resolve(undefined),
      moduleNeeds.tasks ? fetchJson("/api/artifacts?type=TASK", { headers: authHeaders }) : Promise.resolve(undefined),
      moduleNeeds.links ? fetchJson("/api/artifacts?type=LINK", { headers: authHeaders }) : Promise.resolve(undefined),
      moduleNeeds.boards ? fetchJson("/api/whiteboards", { headers: authHeaders }) : Promise.resolve(undefined),
      moduleNeeds.videos ? fetchJson("/api/videos", { headers: authHeaders }) : Promise.resolve(undefined),
      moduleNeeds.files ? fetchJson("/api/files", { headers: authHeaders }) : Promise.resolve(undefined),
      fetchJson("/api/profile", { headers: authHeaders }),
    ]);
    if (moduleNeeds.brief) setDailyBrief(brief ?? null);
    if (moduleNeeds.events) setEvents(e?.events ?? []);
    if (moduleNeeds.stickies) setStickies(s?.notes ?? []);
    if (moduleNeeds.focus) {
      setFocusSessions(f?.sessions ?? []);
      setFocusUsedMinutes(f?.usedMinutes ?? 0);
    }
    if (moduleNeeds.notes) setNotes(n?.artifacts ?? []);
    if (moduleNeeds.tasks) setStudyTasks(t?.artifacts ?? []);
    if (moduleNeeds.links) setStudyLinks(l?.artifacts ?? []);
    if (moduleNeeds.boards) setBoards(b?.boards ?? []);
    if (moduleNeeds.videos) setVideos(v?.videos ?? []);
    if (moduleNeeds.files) setFiles(fi?.files ?? []);
    if (p?.profile?.preferences) {
      const nextPrefs = {
        themePreference: p.profile.preferences.themePreference === "light" ? "light" : "pastel",
        studyGoalMin: p.profile.preferences.studyGoalMin ?? 120,
        focusSessionMin: p.profile.preferences.focusSessionMin ?? 25,
      } as ProfilePreferences;
      setProfilePrefs(nextPrefs);
      setPomodoroMin(nextPrefs.focusSessionMin);
      if (timerPhase === "work" && !timerRunning) {
        setTimerSeconds(nextPrefs.focusSessionMin * 60);
      }
    }
    setModuleLoading((prev) => ({
      ...prev,
      brief: false,
      events: false,
      stickies: false,
      focus: false,
      notes: false,
      tasks: false,
      links: false,
      boards: false,
      videos: false,
      files: false,
    }));
  }, [authHeaders, fetchJson, moduleNeeds]);

  const runSearch = useCallback(async () => {
    if (!moduleNeeds.search) return;
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearchCounts({ all: 0 });
      return;
    }
    setModuleLoading((prev) => ({ ...prev, search: true }));
    setSearchLoading(true);
    try {
      const params = new URLSearchParams({ q, kind: searchKind });
      const data = await fetchJson(`/api/search?${params.toString()}`, { headers: authHeaders });
      setSearchResults(data?.results ?? []);
      setSearchCounts(data?.counts ?? { all: 0 });
    } finally {
      setSearchLoading(false);
      setModuleLoading((prev) => ({ ...prev, search: false }));
    }
  }, [searchQuery, searchKind, fetchJson, authHeaders, moduleNeeds.search]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      void refreshAuth();
    }, 0);
    return () => clearTimeout(id);
  }, [refreshAuth]);

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        persistBrowserSession(session.access_token, session.refresh_token);
        setDemoMode(false);
        setDemoUserId(null);
        setToken(session.access_token);
        setEmail(session.user?.email);
      } else {
        clearBrowserSession();
        setDemoMode(false);
        setDemoUserId(null);
        setToken(null);
        setEmail(undefined);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const id = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(id);
  }, [loadData]);

  useEffect(() => {
    if (!moduleNeeds.search) return;
    const id = setTimeout(() => {
      void runSearch();
    }, 300);
    return () => clearTimeout(id);
  }, [runSearch, moduleNeeds.search]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((value) => !value);
        return;
      }
      if (event.key === "Escape") {
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    const timer = setInterval(() => setTimerSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [timerRunning]);

  useEffect(() => {
    const intervalMs = timerRunning || (focusMode && !!focusLockUntil) ? 1000 : 30000;
    const ticker = setInterval(() => setNowTs(Date.now()), intervalMs);
    return () => clearInterval(ticker);
  }, [timerRunning, focusMode, focusLockUntil]);

  useEffect(() => {
    if (timerSeconds !== 0 || !timerRunning) return;
    const complete = async () => {
      setTimerRunning(false);
      if (timerPhase === "work") {
        const startedAt = workStartedAt ?? new Date(Date.now() - pomodoroMin * 60_000).toISOString();
        await fetch("/api/focus", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({
            durationMin: pomodoroMin,
            breakMin,
            screenLimitMin,
            blockedList: blockedSites,
            note: "Pomodoro complete",
            startedAt,
            endedAt: new Date().toISOString(),
          }),
        });
        setWorkStartedAt(null);
        setTimerPhase("break");
        setTimerSeconds(breakMin * 60);
        await loadData();
        return;
      }
      setTimerPhase("work");
      setTimerSeconds(pomodoroMin * 60);
    };
    void complete();
  }, [timerSeconds, timerRunning, timerPhase, workStartedAt, pomodoroMin, breakMin, screenLimitMin, blockedSites, authHeaders, loadData]);

  useEffect(() => {
    if (!focusLockUntil) return;
    if (focusLockRemainingSec > 0) return;
    const id = setTimeout(() => {
      setFocusLockUntil(null);
      setFocusWarning("Focus lock finished. You can disable Focus Mode now.");
    }, 0);
    return () => clearTimeout(id);
  }, [focusLockUntil, focusLockRemainingSec]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#fffef8";
    ctx.fillRect(0, 0, width, height);
    const drawStroke = (stroke: BoardStroke) => {
      if (!stroke.points.length) return;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.stroke();
    };
    strokes.forEach(drawStroke);
    if (activeStroke) drawStroke(activeStroke);
  }, [strokes, activeStroke]);

  async function post(url: string, body: Record<string, unknown>) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setFocusWarning(payload?.error ?? `Request failed: ${res.status}`);
        return false;
      }
      await loadData();
      return true;
    } catch (error) {
      setFocusWarning(error instanceof Error ? error.message : "Request failed.");
      return false;
    }
  }

  async function seedStudyDemoData() {
    if (seedingDemo) return;
    setSeedingDemo(true);
    try {
      await Promise.all([
        post("/api/artifacts", {
          title: "Revise Thermodynamics Numericals",
          content: "Study: Physics",
          type: "TASK",
          contextKey: "Study/Physics",
          dueAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
        }),
        post("/api/artifacts", {
          title: "Practice Binary Search Problems",
          content: "Study: DSA",
          type: "TASK",
          contextKey: "Study/DSA",
          dueAt: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
        }),
        post("/api/artifacts", {
          title: "GPT Prompt: Organic Chemistry Revision",
          content: "Use this prompt to generate last-minute concept recap questions.",
          type: "LINK",
          source: "https://chat.openai.com/",
          contextKey: "Links/Chemistry",
        }),
        post("/api/videos", {
          title: "Calculus One Shot Revision",
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          comment: "Focus on integration shortcuts.",
          tags: "math,revision",
        }),
        post("/api/sticky", { content: "Target: 3 focused sessions today", color: "#bbf7d0" }),
      ]);
    } finally {
      setSeedingDemo(false);
      await loadData();
    }
  }

  function isBlocked(text: string) {
    const lower = text.toLowerCase();
    return blockedHosts.some((host) => lower.includes(host));
  }

  function canProceedWithText(text: string, label: string) {
    if (!focusMode) return true;
    if (!isBlocked(text)) return true;
    setFocusWarning(`Blocked in Focus Mode: ${label} matches your distraction list.`);
    return false;
  }

  function openExternalLink(url: string) {
    if (!canProceedWithText(url, url)) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function openFileItem(item: FileItem) {
    if (!item.hasStoredFile) {
      openExternalLink(item.pathOrUrl);
      return;
    }

    try {
      const res = await fetch(`/api/files/${item.id}/download`, {
        headers: { ...authHeaders },
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setFocusWarning(payload?.error ?? "Unable to open stored file.");
        return;
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      setFocusWarning(error instanceof Error ? error.message : "Unable to open stored file.");
    }
  }

  async function patch(url: string, body: Record<string, unknown>) {
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setFocusWarning(payload?.error ?? `Request failed: ${res.status}`);
        return false;
      }
      await loadData();
      return true;
    } catch (error) {
      setFocusWarning(error instanceof Error ? error.message : "Request failed.");
      return false;
    }
  }

  async function removeItem(url: string) {
    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: { ...authHeaders },
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setFocusWarning(payload?.error ?? `Request failed: ${res.status}`);
        return false;
      }
      await loadData();
      return true;
    } catch (error) {
      setFocusWarning(error instanceof Error ? error.message : "Request failed.");
      return false;
    }
  }

  async function createQuickTask() {
    const title = quickTaskTitle.trim();
    if (!title) return;
    if (!canProceedWithText(title, "quick task")) return;
    await post("/api/artifacts", {
      title,
      content: "Quick task",
      type: "TASK",
      dueAt: quickTaskDue ? new Date(quickTaskDue).toISOString() : null,
    });
    setQuickTaskTitle("");
    setQuickTaskDue("");
  }

  async function createQuickCapture() {
    const title = captureTitle.trim();
    if (!title) return;
    if (captureType === "LINK") {
      const rawUrl = captureUrl.trim();
      if (!rawUrl) return;
      let parsed: URL;
      try {
        parsed = new URL(rawUrl);
      } catch {
        setFocusWarning("Invalid link URL.");
        return;
      }
      await post("/api/artifacts", {
        title,
        content: captureBody.trim() || "Quick resource",
        type: "LINK",
        source: parsed.toString(),
        contextKey: "QuickCapture",
        dueAt: captureDueAt ? new Date(captureDueAt).toISOString() : null,
      });
    } else if (captureType === "NOTE") {
      await post("/api/artifacts", {
        title,
        content: captureBody.trim() || "Quick note",
        type: "NOTE",
        contextKey: "QuickCapture",
      });
    } else {
      await post("/api/artifacts", {
        title,
        content: captureBody.trim() || "Quick task",
        type: "TASK",
        contextKey: "QuickCapture",
        dueAt: captureDueAt ? new Date(captureDueAt).toISOString() : null,
      });
    }
    setCaptureTitle("");
    setCaptureBody("");
    setCaptureUrl("");
    setCaptureDueAt("");
  }

  async function createEvent() {
    const title = eventTitle.trim();
    if (!title || !eventStart) return;
    if (!canProceedWithText(`${title} ${eventReminder}`, "event")) return;
    await post("/api/events", {
      title,
      startAt: new Date(eventStart).toISOString(),
      reminderAt: eventReminder ? new Date(eventReminder).toISOString() : null,
      isImportant: true,
    });
    setEventTitle("");
    setEventStart("");
    setEventReminder("");
  }

  async function createStudyTask() {
    const title = studyTitle.trim();
    if (!title) return;
    if (!canProceedWithText(`${title}\n${studySubject}`, "study task")) return;
    await post("/api/artifacts", {
      title,
      content: `Study: ${studySubject}`,
      type: "TASK",
      contextKey: `Study/${studySubject.trim() || "General"}`,
      dueAt: studyDueAt ? new Date(studyDueAt).toISOString() : null,
    });
    setStudyTitle("");
    setStudyDueAt("");
  }

  async function createStudyLink() {
    const title = linkTitle.trim();
    const rawUrl = linkUrl.trim();
    if (!title || !rawUrl) return;
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      setFocusWarning("Invalid link URL.");
      return;
    }
    if (!canProceedWithText(`${title}\n${parsed.toString()}\n${linkNote}`, "study link")) return;
    await post("/api/artifacts", {
      title,
      content: linkNote.trim() || "Study resource link",
      type: "LINK",
      source: parsed.toString(),
      contextKey: `Links/${resourceType}/${linkContext.trim() || "Study"}`,
      dueAt: linkDueAt ? new Date(linkDueAt).toISOString() : null,
    });
    setLinkTitle("");
    setLinkUrl("");
    setLinkDueAt("");
    setLinkNote("");
  }

  async function createVideo() {
    const title = videoTitle.trim();
    const url = videoUrl.trim();
    if (!title || !url) return;
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      setFocusWarning("Invalid video URL.");
      return;
    }
    if (!canProceedWithText(`${title}\n${url}\n${videoComment}\n${videoTags}`, "video")) return;
    await post("/api/videos", {
      title,
      url: parsed.toString(),
      comment: videoComment.trim() || undefined,
      tags: videoTags.trim() || undefined,
    });
    setVideoTitle("");
    setVideoUrl("");
    setVideoComment("");
    setVideoTags("");
  }

  async function toggleVideoComplete(video: VideoBookmark) {
    await patch(`/api/videos/${video.id}`, { isCompleted: !video.isCompleted });
  }

  async function toggleFileComplete(item: FileItem) {
    await patch(`/api/files/${item.id}`, { isCompleted: !item.isCompleted });
  }

  function applyStickyTemplate(type: "revision" | "exam" | "doubt" | "assignment") {
    if (type === "revision") {
      setStickyContent("Revision block: 45 min + 10 min recall");
      setStickyColor("#fef08a");
    } else if (type === "exam") {
      setStickyContent("Exam prep: solve 2 timed sets today");
      setStickyColor("#fecaca");
    } else if (type === "doubt") {
      setStickyContent("Doubt list: ask mentor by evening");
      setStickyColor("#bfdbfe");
    } else {
      setStickyContent("Assignment checklist: draft, review, submit");
      setStickyColor("#bbf7d0");
    }
  }

  async function createSticky() {
    const content = stickyContent.trim();
    if (!content) return;
    const ok = await post("/api/sticky", { content, color: stickyColor });
    if (!ok) return;
    setStickyContent("");
  }

  async function sendStickyToTask(note: StickyNote) {
    const ok = await post("/api/artifacts", {
      title: note.content.slice(0, 70),
      content: note.content,
      type: "TASK",
      contextKey: "StickyTask",
    });
    if (!ok) return;
    await patch(`/api/sticky/${note.id}`, { isPinned: true });
  }

  async function createFileItem() {
    const name = fileName.trim();
    const pathOrUrl = filePath.trim();
    if (!name || (!pathOrUrl && !selectedFile)) return;
    if (!canProceedWithText(`${name}\n${pathOrUrl || selectedFile?.name || ""}\n${fileTags}`, "file")) return;
    setFileNotice(null);

    if (selectedFile) {
      setUploadingFile(true);
      try {
        const fallbackToMetadataSave = async (reason?: string) => {
          const fallbackSaved = await post("/api/files", {
            name,
            pathOrUrl: pathOrUrl || selectedFile.name,
            category: fileCategory.trim() || undefined,
            subject: fileSubject.trim() || undefined,
            tags: fileTags.trim() || undefined,
            lastPosition: fileLastPosition.trim() || undefined,
            progressNote: fileProgressNote.trim() || undefined,
          });
          if (fallbackSaved) {
            setFileNotice(reason ?? "File metadata saved. Direct binary upload was skipped in this environment.");
          }
          return fallbackSaved;
        };

        if (selectedFile.size > 4 * 1024 * 1024) {
          await fallbackToMetadataSave("Large files are saved as metadata in the deployed app. Add the file link/path if you need direct open support.");
        } else {
          const formData = new FormData();
          formData.append("file", selectedFile);
          formData.append("name", name);
          formData.append("pathOrUrl", pathOrUrl || selectedFile.name);
          if (fileCategory.trim()) formData.append("category", fileCategory.trim());
          if (fileSubject.trim()) formData.append("subject", fileSubject.trim());
          if (fileTags.trim()) formData.append("tags", fileTags.trim());
          if (fileLastPosition.trim()) formData.append("lastPosition", fileLastPosition.trim());
          if (fileProgressNote.trim()) formData.append("progressNote", fileProgressNote.trim());

          const res = await fetch("/api/files", {
            method: "POST",
            headers: { ...authHeaders },
            body: formData,
          });
          const json = await res.json().catch(() => null);
          if (!res.ok) {
            await fallbackToMetadataSave(json?.error ?? "Binary upload failed, saved file details only.");
            return;
          }
          setFiles((current) => [json.file, ...current]);
          setFileNotice("File saved successfully.");
        }
      } finally {
        setUploadingFile(false);
      }
    } else {
      const ok = await post("/api/files", {
        name,
        pathOrUrl,
        category: fileCategory.trim() || undefined,
        subject: fileSubject.trim() || undefined,
        tags: fileTags.trim() || undefined,
        lastPosition: fileLastPosition.trim() || undefined,
        progressNote: fileProgressNote.trim() || undefined,
      });
      if (ok) setFileNotice("File link saved successfully.");
    }

    setFileName("");
    setFilePath("");
    setFileCategory("");
    setFileSubject("");
    setFileTags("");
    setFileLastPosition("");
    setFileProgressNote("");
    setSelectedFile(null);
  }

  function applyNoteFormat(prefix: string, suffix = "") {
    const input = noteInputRef.current;
    if (!input) return;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const selected = noteBody.slice(start, end);
    const next = `${noteBody.slice(0, start)}${prefix}${selected || "text"}${suffix}${noteBody.slice(end)}`;
    setNoteBody(next);
    requestAnimationFrame(() => input.focus());
  }

  function applyNoteTemplate(type: "summary" | "revision" | "questions") {
    if (type === "summary") {
      setNoteTitle((current) => current || "Topic Summary");
      setNoteBody("## Key ideas\n- \n\n## Important formulas\n- \n\n## Recall points\n- ");
      setNoteContext("Summary");
      return;
    }
    if (type === "revision") {
      setNoteTitle((current) => current || "Revision Sheet");
      setNoteBody("## Must revise\n- \n\n## Mistakes to avoid\n- \n\n## Last-minute checklist\n- ");
      setNoteContext("Revision");
      return;
    }
    setNoteTitle((current) => current || "Question Bank");
    setNoteBody("## Questions\n1. \n2. \n3. \n\n## Doubts\n- ");
    setNoteContext("Practice");
  }

  function applyNoteColor(color: "cyan" | "amber" | "rose" | "emerald") {
    applyNoteFormat(`[${color}]`, `[/${color}]`);
  }

  async function createNote() {
    const title = noteTitle.trim();
    const body = noteBody.trim();
    if (!title || !body) return;
    if (!canProceedWithText(`${title}\n${body}`, "note")) return;
    await post("/api/artifacts", {
      title,
      content: body,
      type: "NOTE",
      contextKey: noteContext || "General",
    });
    setNoteTitle("");
    setNoteBody("");
  }

  function pointerToCanvasPoint(e: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startStroke(e: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const point = pointerToCanvasPoint(e);
    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    setActiveStroke({ color: brushColor, size: brushSize, points: [point] });
  }

  function moveStroke(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const point = pointerToCanvasPoint(e);
    setActiveStroke((current) => (current ? { ...current, points: [...current.points, point] } : current));
  }

  function endStroke(e: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // no-op
      }
    }
    setIsDrawing(false);
    setActiveStroke((current) => {
      if (!current || current.points.length < 2) return null;
      setStrokes((existing) => [...existing, current]);
      return null;
    });
  }

  function clearBoard() {
    setStrokes([]);
    setActiveStroke(null);
  }

  async function saveWhiteboard() {
    const title = boardTitle.trim();
    if (!title || !strokes.length) return;
    if (!canProceedWithText(title, "whiteboard")) return;
    await post("/api/whiteboards", { title, dataJson: JSON.stringify({ strokes }) });
  }

  function loadWhiteboard(board: Whiteboard) {
    try {
      const parsed = JSON.parse(board.dataJson) as { strokes?: BoardStroke[] };
      setBoardTitle(board.title);
      setStrokes(parsed.strokes ?? []);
    } catch {
      setBoardTitle(board.title);
      setStrokes([]);
    }
  }

  function toggleFocusMode() {
    if (focusMode && focusLockRemainingSec > 0) {
      setFocusWarning(`Focus lock active for ${Math.ceil(focusLockRemainingSec / 60)} more minute(s).`);
      return;
    }
    setFocusMode((value) => !value);
    setFocusWarning(null);
  }

  function toggleTimer() {
    if (!timerRunning) {
      if (focusMode && timerPhase === "work" && !workStartedAt) {
        setWorkStartedAt(new Date().toISOString());
        setFocusLockUntil(new Date(Date.now() + focusLockMin * 60_000).toISOString());
      }
      setFocusWarning(null);
      setTimerRunning(true);
      return;
    }
    if (focusMode && focusLockRemainingSec > 0) {
      setFocusWarning("Pause blocked while Focus Lock is active.");
      return;
    }
    setTimerRunning(false);
  }

  function resetTimer() {
    if (focusMode && focusLockRemainingSec > 0) {
      setFocusWarning("Reset blocked while Focus Lock is active.");
      return;
    }
    setTimerRunning(false);
    setTimerPhase("work");
    setTimerSeconds(pomodoroMin * 60);
    setWorkStartedAt(null);
    setFocusLockUntil(null);
  }

  const commandItems = useMemo<CommandItem[]>(
    () => [
      { id: "go-capture", label: "Go to Quick Capture", hint: "Jump", keywords: "quick capture inbox", run: () => jumpTo("quick-capture") },
      { id: "go-brief", label: "Go to Daily Brief", hint: "Jump", keywords: "brief summary today", run: () => jumpTo("daily-brief") },
      { id: "go-dashboard", label: "Go to Dashboard", hint: "Jump", keywords: "dashboard tasks meetings", run: () => jumpTo("dashboard") },
      { id: "go-study", label: "Go to Study Organizer", hint: "Jump", keywords: "study subject tasks", run: () => jumpTo("study-organizer") },
      { id: "go-links", label: "Go to Study Links", hint: "Jump", keywords: "gpt links resources", run: () => jumpTo("study-links") },
      { id: "go-timeline", label: "Go to Today Timeline", hint: "Jump", keywords: "timeline schedule day", run: () => jumpTo("timeline") },
      { id: "go-insights", label: "Go to Planner Insights", hint: "Jump", keywords: "insights plan suggestions", run: () => jumpTo("planner-insights") },
      { id: "go-notes", label: "Go to Notes", hint: "Jump", keywords: "notes markdown", run: () => jumpTo("notes") },
      { id: "go-videos", label: "Go to YouTube Vault", hint: "Jump", keywords: "videos youtube", run: () => jumpTo("videos") },
      { id: "go-files", label: "Go to Files Organizer", hint: "Jump", keywords: "files organizer", run: () => jumpTo("files") },
      { id: "go-search", label: "Go to Unified Search", hint: "Jump", keywords: "search find", run: () => jumpTo("search") },
      { id: "go-focus", label: "Go to Focus Lab", hint: "Jump", keywords: "focus pomodoro", run: () => jumpTo("focus-lab") },
      {
        id: "new-task",
        label: "Quick Task: focus input",
        hint: "Action",
        keywords: "task create",
        run: () => {
          jumpTo("dashboard");
          quickTaskInputRef.current?.focus();
        },
      },
      {
        id: "new-note",
        label: "New Note: focus title",
        hint: "Action",
        keywords: "note create",
        run: () => {
          jumpTo("notes");
          noteTitleInputRef.current?.focus();
        },
      },
      {
        id: "new-video",
        label: "New Video: focus title",
        hint: "Action",
        keywords: "video youtube create",
        run: () => {
          jumpTo("videos");
          videoTitleInputRef.current?.focus();
        },
      },
      {
        id: "new-file",
        label: "New File: focus name",
        hint: "Action",
        keywords: "file create",
        run: () => {
          jumpTo("files");
          fileNameInputRef.current?.focus();
        },
      },
      {
        id: "toggle-focus",
        label: focusMode ? "Turn Focus Mode Off" : "Turn Focus Mode On",
        hint: "Toggle",
        keywords: "focus mode",
        run: () => {
          if (focusMode && focusLockRemainingSec > 0) {
            setFocusWarning(`Focus lock active for ${Math.ceil(focusLockRemainingSec / 60)} more minute(s).`);
            return;
          }
          setFocusMode((value) => !value);
          setFocusWarning(null);
        },
      },
    ],
    [focusMode, focusLockRemainingSec],
  );

  const filteredCommands = useMemo(() => {
    const q = paletteQuery.trim().toLowerCase();
    if (!q) return commandItems;
    return commandItems.filter((item) => `${item.label} ${item.keywords}`.toLowerCase().includes(q));
  }, [paletteQuery, commandItems]);

  const timerLabel = `${String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:${String(timerSeconds % 60).padStart(2, "0")}`;
  const currentTimerBase = timerPhase === "work" ? pomodoroMin * 60 : breakMin * 60;
  const timerProgress = currentTimerBase > 0 ? Math.max(0, Math.min(100, ((currentTimerBase - timerSeconds) / currentTimerBase) * 100)) : 0;
  const shortcutItems = [
    { id: "notes", label: "Notes", detail: "Capture class notes and revision points", run: () => jumpTo("notes") },
    { id: "videos", label: "YouTube Links", detail: "Save lectures and mark progress", run: () => jumpTo("videos") },
    { id: "files", label: "File Manager", detail: "Keep PDFs, slides, and study docs", run: () => jumpTo("files") },
  ];
  const sidebarCounts = useMemo<Partial<Record<WorkspaceModuleId, number>>>(() => ({
    "quick-capture": dailyBrief?.summary.pendingTasks ?? 0,
    dashboard: todayTimeline.length,
    files: files.length,
    videos: videos.length,
    notes: notes.length,
    "study-links": studyLinks.length,
    "focus-lab": focusSessions.length,
  }), [dailyBrief?.summary.pendingTasks, todayTimeline.length, files.length, videos.length, notes.length, studyLinks.length, focusSessions.length]);

  useEffect(() => {
    onCountsChange?.(sidebarCounts);
  }, [onCountsChange, sidebarCounts]);

  const renderModuleSkeleton = useCallback((count = 3) => (
    <div className="grid gap-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="module-skeleton-card">
          <div className="module-skeleton-line module-skeleton-line-lg" />
          <div className="module-skeleton-line module-skeleton-line-md" />
          <div className="module-skeleton-line module-skeleton-line-sm" />
        </div>
      ))}
    </div>
  ), []);

  async function updateStickyPosition(note: StickyNote, info: PanInfo) {
    const nextPosX = Math.round((note.posX ?? 0) + info.offset.x);
    const nextPosY = Math.round((note.posY ?? 0) + info.offset.y);
    setStickies((current) =>
      current.map((item) => (item.id === note.id ? { ...item, posX: nextPosX, posY: nextPosY } : item)),
    );
    await patch(`/api/sticky/${note.id}`, { posX: nextPosX, posY: nextPosY });
  }

  return (
    <div className="space-y-6">
      {showOverview ? (
      <section className="panel workspace-command-bar p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-500">StudyOrbit Command Bar</p>
            <p className="text-sm text-slate-400">{email ?? "Guest session"} - {focusMode ? "Focus mode active" : "Focus mode off"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-xs" onClick={seedStudyDemoData} disabled={seedingDemo}>
              {seedingDemo ? "Loading..." : "Load Demo Study Setup"}
            </button>
            <button className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-xs" onClick={() => jumpTo("dashboard")}>
              <Zap className="h-3.5 w-3.5" /> Quick Add
            </button>
            <button className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-xs" onClick={() => jumpTo("search")}>
              <Search className="h-3.5 w-3.5" /> Search
            </button>
            <button
              className="btn-primary inline-flex items-center gap-2 px-3 py-2 text-xs"
              onClick={() => {
                setPaletteQuery("");
                setPaletteOpen(true);
              }}
            >
              <Command className="h-3.5 w-3.5" /> Command Palette
            </button>
            <span className="chip inline-flex items-center gap-1 text-xs">
              <UserCircle2 className="h-3.5 w-3.5" /> {demoMode ? "Guest" : "Signed-in"}
            </span>
          </div>
        </div>
      </section>
      ) : null}

      {showOverview ? (
      <section className="workspace-metric-grid">
        <div className="workspace-metric-card">
          <span className="workspace-metric-accent workspace-metric-accent-violet" />
          <h3 className="sub-title"><Layers3 className="h-3.5 w-3.5" /> Task completion</h3>
          <p className="text-3xl font-black text-slate-50">{studyMetrics.pctTasks}%</p>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${studyMetrics.pctTasks}%` }} /></div>
          <p className="text-xs text-slate-400">{studyMetrics.completedTasks}/{studyMetrics.totalTasks} tasks completed</p>
        </div>
        <div className="workspace-metric-card">
          <span className="workspace-metric-accent workspace-metric-accent-cyan" />
          <h3 className="sub-title"><Timer className="h-3.5 w-3.5" /> Study goal</h3>
          <p className="text-3xl font-black text-slate-50">{(focusUsedMinutes / 60).toFixed(1)}h</p>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${studyGoalProgress}%` }} /></div>
          <p className="text-xs text-slate-400">{focusUsedMinutes}/{profilePrefs.studyGoalMin} minutes toward daily goal</p>
        </div>
        <div className="workspace-metric-card">
          <span className="workspace-metric-accent workspace-metric-accent-emerald" />
          <h3 className="sub-title"><FileStack className="h-3.5 w-3.5" /> Saved files</h3>
          <p className="text-3xl font-black text-slate-50">{files.length}</p>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, files.length * 12)}%` }} /></div>
          <p className="text-xs text-slate-400">{fileSubjectGroups.length} subject groups organized</p>
        </div>
        <div className="workspace-metric-card">
          <span className="workspace-metric-accent workspace-metric-accent-amber" />
          <h3 className="sub-title"><Pin className="h-3.5 w-3.5" /> Study streak</h3>
          <p className="text-3xl font-black text-slate-50">{studyStreak.days}</p>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, studyStreak.days * 14)}%` }} /></div>
          <p className="text-xs text-slate-400">{studyStreak.lastDay ? `Last session ${toLabel(studyStreak.lastDay)}` : "Start a focus session today"}</p>
        </div>
      </section>
      ) : null}

      {showOverview ? (
      <section className="grid gap-4 xl:grid-cols-[1.35fr_360px]">
        <div className="soft-card dashboard-hero-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-500">{greeting}</p>
              <h2 className="mt-2 text-3xl font-black text-slate-50">Your day, arranged and actionable.</h2>
              <p className="mt-1 text-sm text-slate-400">
                {mounted
                  ? `${nowDate.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })} - ${nowDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : "Loading local time..."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="chip">Morning: {segmentCounts.morning}</span>
              <span className="chip">Afternoon: {segmentCounts.afternoon}</span>
              <span className="chip">Evening: {segmentCounts.evening}</span>
              <span className={`chip ${nextUp ? "chip-warn" : ""}`}>
                Next: {nextUp ? `${nextUp.title} in ${timeUntilLabel(nextUp.at ?? new Date().toISOString(), nowTs)}` : "Nothing pending"}
              </span>
            </div>
          </div>
        </div>
        <div className="soft-card dashboard-focus-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-500">Focus Timer</p>
              <p className="mt-1 text-sm text-slate-400">{timerPhase === "work" ? "Deep work running" : "Break window"}</p>
            </div>
            <span className={`chip ${focusMode ? "chip-active" : ""}`}>{focusMode ? "Focus ON" : "Focus OFF"}</span>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="progress-ring" style={{ ["--progress" as string]: `${timerProgress}%` }}>
              <div className="progress-ring-inner">
                <span>{timerLabel}</span>
              </div>
            </div>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex flex-wrap gap-2">
                <button className={`chip ${timerPhase === "work" ? "chip-active" : ""}`} onClick={() => { setTimerPhase("work"); setTimerSeconds(pomodoroMin * 60); }}>Focus {pomodoroMin}m</button>
                <button className={`chip ${timerPhase === "break" && breakMin === 5 ? "chip-active" : ""}`} onClick={() => { setTimerPhase("break"); setBreakMin(5); setTimerSeconds(5 * 60); }}>Short 5m</button>
                <button className={`chip ${timerPhase === "break" && breakMin === 15 ? "chip-active" : ""}`} onClick={() => { setTimerPhase("break"); setBreakMin(15); setTimerSeconds(15 * 60); }}>Long 15m</button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary px-4 py-2 text-sm" onClick={toggleTimer}>{timerRunning ? "Pause" : "Start"}</button>
                <button className="btn-secondary px-4 py-2 text-sm" onClick={resetTimer}>Reset</button>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span key={index} className={`session-dot ${index < Math.min(studyStreak.days, 5) ? "session-dot-active" : ""}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {showOverview ? <AuthPanel ready={ready} loggedIn={!!token} email={email} demoMode={demoMode} onRefresh={refreshAuth} /> : null}

      {showModule("quick-capture") ? (
      <CollapsibleCard id="quick-capture" title="Quick Capture" icon={<Plus className="h-4 w-4" />}>
        <div className="grid gap-2 md:grid-cols-[150px_1fr]">
          <select className="input" value={captureType} onChange={(e) => setCaptureType(e.target.value as "TASK" | "NOTE" | "LINK")}>
            <option value="TASK">Task</option>
            <option value="NOTE">Note</option>
            <option value="LINK">Link</option>
          </select>
          <input className="input" placeholder="Title" value={captureTitle} onChange={(e) => setCaptureTitle(e.target.value)} />
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <textarea className="input min-h-24" placeholder="Details (optional)" value={captureBody} onChange={(e) => setCaptureBody(e.target.value)} />
          <div className="grid gap-2">
            {captureType === "LINK" ? (
              <input className="input" placeholder="https://..." value={captureUrl} onChange={(e) => setCaptureUrl(e.target.value)} />
            ) : null}
            {(captureType === "TASK" || captureType === "LINK") ? (
              <input className="input" type="datetime-local" value={captureDueAt} onChange={(e) => setCaptureDueAt(e.target.value)} />
            ) : null}
            <button className="btn-primary px-4 py-2 text-sm" onClick={createQuickCapture}>Save</button>
          </div>
        </div>
      </CollapsibleCard>
      ) : null}

      {showAllModules || activeModule === "dashboard" ? (
      <motion.section id="daily-brief" {...cardMotion} className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="title-sm">Daily Brief</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="chip">Events: {dailyBrief?.summary.eventsToday ?? 0}</span>
            <span className="chip">Tasks: {dailyBrief?.summary.pendingTasks ?? 0}</span>
            <span className="chip">Reminders: {dailyBrief?.summary.remindersDue ?? 0}</span>
            <span className="chip">Overdue: {dailyBrief?.summary.overdueTasks ?? 0}</span>
            <span className="chip">Pinned: {dailyBrief?.summary.pinnedNotes ?? 0}</span>
            <span className="chip">Notes: {dailyBrief?.summary.notesSaved ?? 0}</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Today: {dailyBrief?.summary.eventsToday ?? 0} meetings, {dailyBrief?.summary.pendingTasks ?? 0} tasks, {dailyBrief?.summary.notesSaved ?? 0} notes.
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {(dailyBrief?.recentNotes ?? []).slice(0, 2).map((item) => (
            <div key={item.id} className="timeline-card">
              <p className="text-xs font-semibold text-slate-700">{item.title}</p>
              <p className="line-clamp-1 text-[11px] text-slate-500">{item.content}</p>
            </div>
          ))}
        </div>
      </motion.section>
      ) : null}

      {showAllModules || activeModule === "dashboard" ? (
      <motion.section id="dashboard" {...cardMotion} className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="title-sm">Task Schedule</h2>
            <p className="mt-1 text-sm text-slate-400">Clickable tasks, deadlines, and direct access to study modules.</p>
          </div>
          <div className="flex gap-1 text-[11px]">
            <button className={`chip ${taskStatusFilter === "all" ? "chip-active" : ""}`} onClick={() => setTaskStatusFilter("all")}>All</button>
            <button className={`chip ${taskStatusFilter === "pending" ? "chip-active" : ""}`} onClick={() => setTaskStatusFilter("pending")}>Pending</button>
            <button className={`chip ${taskStatusFilter === "in-progress" ? "chip-active" : ""}`} onClick={() => setTaskStatusFilter("in-progress")}>In Progress</button>
            <button className={`chip ${taskStatusFilter === "completed" ? "chip-active" : ""}`} onClick={() => setTaskStatusFilter("completed")}>Done</button>
          </div>
        </div>
        {(dailyBrief?.summary.overdueTasks ?? 0) > 0 ? (
          <div className="mb-3 rounded-lg border border-amber-300/40 bg-amber-100/70 p-2 text-xs text-amber-700">
            Priority: {(dailyBrief?.summary.overdueTasks ?? 0)} overdue tasks pending.
          </div>
        ) : null}
        <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
          <input ref={quickTaskInputRef} className="input" placeholder="Quick add task" value={quickTaskTitle} onChange={(e) => setQuickTaskTitle(e.target.value)} />
          <input className="input" type="datetime-local" value={quickTaskDue} onChange={(e) => setQuickTaskDue(e.target.value)} />
          <button className="btn-primary px-3" onClick={createQuickTask}>
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
          <div className="soft-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="sub-title">Today tasks</h3>
              <span className="chip">Tap card to toggle done</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              <span className="chip">All: {(dailyBrief?.todayTasks ?? []).length}</span>
              <span className="chip chip-warn">Pending: {(dailyBrief?.todayTasks ?? []).filter((task) => taskStatusOf(task) === "PENDING").length}</span>
              <span className="chip border-cyan-200 bg-cyan-50 text-cyan-700">In Progress: {(dailyBrief?.todayTasks ?? []).filter((task) => taskStatusOf(task) === "IN_PROGRESS").length}</span>
              <span className="chip">Completed: {(dailyBrief?.todayTasks ?? []).filter((task) => taskStatusOf(task) === "COMPLETED").length}</span>
            </div>
            <div className="mt-3 grid gap-3">
              {moduleLoading.tasks ? renderModuleSkeleton(4) : null}
              {!moduleLoading.tasks && filteredTodayTasks.slice(0, 6).map((task) => {
                const status = taskStatusOf(task);
                const isOverdue = task.dueAt ? new Date(task.dueAt).getTime() < nowTs && status !== "COMPLETED" : false;
                const priorityClass = isOverdue ? "priority-dot-high" : status === "IN_PROGRESS" ? "priority-dot-mid" : "priority-dot-low";
                return (
                <button
                  key={task.id}
                  className="task-board-card text-left"
                  onClick={() => patch(`/api/artifacts/${task.id}`, { status: status === "COMPLETED" ? "PENDING" : "COMPLETED" })}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`priority-dot ${priorityClass}`} />
                        <p className="truncate text-sm font-medium text-slate-100">{task.title}</p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="chip">{task.contextKey ?? "Study"}</span>
                        {task.dueAt ? <span className="chip">{toLabel(task.dueAt)}</span> : <span className="chip">No due time</span>}
                        <span className={`chip text-[10px] ${taskStatusChipClass(status)}`}>{taskStatusLabel(status)}</span>
                      </div>
                    </div>
                    <CheckCircle2 className={`h-5 w-5 shrink-0 ${status === "COMPLETED" ? "text-emerald-400" : "text-slate-500"}`} />
                  </div>
                </button>
              )})}
            </div>
            {!moduleLoading.tasks && filteredTodayTasks.length === 0 ? <p className="mt-2 text-xs text-slate-400">No tasks in this status.</p> : null}
          </div>
          <div className="grid gap-4">
            <div className="soft-card p-4">
              <h3 className="sub-title">Upcoming</h3>
              <div className="mt-3 grid gap-2">
                {(dailyBrief?.todayEvents ?? []).slice(0, 2).map((meeting) => (
                  <div key={meeting.id} className="timeline-card">
                    <p className="text-sm font-semibold text-slate-100">{meeting.title}</p>
                    <p className="text-xs text-slate-400">{toLabel(meeting.startAt)}</p>
                  </div>
                ))}
                {(dailyBrief?.remindersDue ?? []).slice(0, 2).map((item) => (
                  <div key={item.id} className="timeline-card">
                    <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                    <p className="text-xs text-slate-400">{toLabel(item.reminderAt)}</p>
                  </div>
                ))}
                {(dailyBrief?.todayEvents ?? []).length === 0 && (dailyBrief?.remindersDue ?? []).length === 0 ? <p className="text-xs text-slate-400">No meetings or reminders scheduled.</p> : null}
              </div>
            </div>
            <div className="soft-card p-4">
              <h3 className="sub-title">Module shortcuts</h3>
              <div className="mt-3 grid gap-3">
                {shortcutItems.map((item) => (
                  <button key={item.id} className="module-shortcut-card text-left" onClick={item.run}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-100">{item.label}</p>
                      <ChevronRight className="h-4 w-4 text-cyan-300" />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{item.detail}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>
      ) : null}

      {showModule("study-organizer") ? (
      <CollapsibleCard id="study-organizer" title="Study Organizer" icon={<PenSquare className="h-4 w-4" />}>
        <div className="grid gap-2 md:grid-cols-[1fr_220px_220px_auto]">
          <input className="input" placeholder="Study task (e.g., Chapter 3 Revision)" value={studyTitle} onChange={(e) => setStudyTitle(e.target.value)} />
          <input className="input" placeholder="Subject / Topic" value={studySubject} onChange={(e) => setStudySubject(e.target.value)} />
          <input className="input" type="datetime-local" value={studyDueAt} onChange={(e) => setStudyDueAt(e.target.value)} />
          <button className="btn-primary px-4 py-2 text-sm" onClick={createStudyTask}>Add</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <button className={`chip ${taskStatusFilter === "all" ? "chip-active" : ""}`} onClick={() => setTaskStatusFilter("all")}>All tasks</button>
          <button className={`chip ${taskStatusFilter === "pending" ? "chip-active" : ""}`} onClick={() => setTaskStatusFilter("pending")}>Pending</button>
          <button className={`chip ${taskStatusFilter === "in-progress" ? "chip-active" : ""}`} onClick={() => setTaskStatusFilter("in-progress")}>In Progress</button>
          <button className={`chip ${taskStatusFilter === "completed" ? "chip-active" : ""}`} onClick={() => setTaskStatusFilter("completed")}>Completed</button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
          <span className="chip">All: {studyTasks.length}</span>
          <span className="chip chip-warn">Pending: {studyTasks.filter((task) => taskStatusOf(task) === "PENDING").length}</span>
          <span className="chip border-cyan-200 bg-cyan-50 text-cyan-700">In Progress: {studyTasks.filter((task) => taskStatusOf(task) === "IN_PROGRESS").length}</span>
          <span className="chip">Completed: {studyTasks.filter((task) => taskStatusOf(task) === "COMPLETED").length}</span>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {filteredStudyTasks.slice(0, 10).map((task) => (
            <div key={task.id} className="saved-card">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-700">{task.title}</p>
                <span className={`chip text-[10px] ${taskStatusChipClass(taskStatusOf(task))}`}>{taskStatusLabel(taskStatusOf(task))}</span>
              </div>
              <p className="text-xs text-cyan-600">{task.contextKey ?? "Study/General"}</p>
              <p className="text-xs text-slate-500">{task.dueAt ? `Due: ${toLabel(task.dueAt)}` : "No due time"}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select
                  className="input max-w-[180px] py-2 text-xs"
                  value={taskStatusOf(task)}
                  onChange={(e) => patch(`/api/artifacts/${task.id}`, { status: e.target.value })}
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
                <button
                  className="inline-flex items-center gap-1 text-xs font-medium text-cyan-600"
                  onClick={() => patch(`/api/artifacts/${task.id}`, { status: "COMPLETED" })}
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Quick complete
                </button>
              </div>
            </div>
          ))}
          {filteredStudyTasks.length === 0 ? <p className="text-xs text-slate-400">No study tasks in this status.</p> : null}
        </div>
      </CollapsibleCard>
      ) : null}

      {showModule("study-links") ? (
      <CollapsibleCard id="study-links" title="Study Resources" icon={<Link2 className="h-4 w-4" />} defaultOpen={false}>
        <div className="grid gap-2 md:grid-cols-2">
          <input className="input" placeholder="Link title (e.g., GPT Physics Prompt)" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} />
          <input className="input" placeholder="Resource URL (YouTube, article, GPT, Spotify)" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <button className={`chip ${resourceType === "GPT" ? "ring-1 ring-cyan-300/60" : ""}`} onClick={() => setResourceType("GPT")}>GPT</button>
          <button className={`chip ${resourceType === "YOUTUBE" ? "ring-1 ring-cyan-300/60" : ""}`} onClick={() => setResourceType("YOUTUBE")}>YouTube</button>
          <button className={`chip ${resourceType === "SPOTIFY" ? "ring-1 ring-cyan-300/60" : ""}`} onClick={() => setResourceType("SPOTIFY")}>Spotify</button>
          <button className={`chip ${resourceType === "ARTICLE" ? "ring-1 ring-cyan-300/60" : ""}`} onClick={() => setResourceType("ARTICLE")}>Article</button>
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <input className="input" placeholder="Context (Study, Math, DSA...)" value={linkContext} onChange={(e) => setLinkContext(e.target.value)} />
          <input className="input" type="datetime-local" value={linkDueAt} onChange={(e) => setLinkDueAt(e.target.value)} />
          <button className="btn-primary px-4 py-2 text-sm" onClick={createStudyLink}>Save Link</button>
        </div>
        <textarea className="input mt-2 min-h-20" placeholder="Notes about this link..." value={linkNote} onChange={(e) => setLinkNote(e.target.value)} />
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {studyLinks.map((item) => (
            <div key={item.id} className="saved-card">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-700">{item.title}</p>
                <div className="flex items-center gap-2">
                  <span className="chip text-[10px]">{(item.contextKey?.split("/")[1] ?? "LINK").toUpperCase()}</span>
                  <button className="text-slate-400 transition hover:text-rose-300" onClick={() => removeItem(`/api/artifacts/${item.id}`)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-cyan-500">{item.contextKey ?? "Links/Study"}</p>
              <p className="line-clamp-2 text-xs text-slate-500">{item.content}</p>
              {item.dueAt ? <p className="text-[11px] text-amber-300">Due: {toLabel(item.dueAt)}</p> : null}
              <p className="text-[11px] text-slate-400">Saved: {toLabel(item.createdAt)}</p>
              {item.source ? (
                <button className="mt-2 inline-flex items-center gap-1 text-[11px] text-cyan-200 underline" onClick={() => openExternalLink(item.source ?? "")}>
                  <ExternalLink className="h-3 w-3" /> Open link
                </button>
              ) : null}
            </div>
          ))}
          {studyLinks.length === 0 ? (
            <div className="empty-state md:col-span-2">
              <div className="empty-illustration"><Link2 className="h-6 w-6" /></div>
              <p className="text-sm font-semibold text-slate-700">No study links yet</p>
              <p className="mt-1 text-xs text-slate-500">Save GPT, YouTube, article, or Spotify resources here.</p>
            </div>
          ) : null}
        </div>
      </CollapsibleCard>
      ) : null}

      {showAllModules || activeModule === "dashboard" || activeModule === "timeline" ? (
      <CollapsibleCard id="timeline" title="Today Timeline" icon={<Clock3 className="h-4 w-4" />}>
        <div className="grid gap-2">
          {moduleLoading.brief || moduleLoading.tasks || moduleLoading.events ? renderModuleSkeleton(4) : null}
          {!moduleLoading.brief && !moduleLoading.tasks && !moduleLoading.events && todayTimeline.slice(0, 12).map((item) => (
            <div key={item.id} className="timeline-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-700">{item.title}</p>
                  {item.type === "task" ? (
                    <span className={`chip text-[10px] ${taskStatusChipClass(item.status ?? (item.isDone ? "COMPLETED" : "PENDING"))}`}>
                      {taskStatusLabel(item.status ?? (item.isDone ? "COMPLETED" : "PENDING"))}
                    </span>
                  ) : null}
                </div>
                <span className="chip text-[11px] uppercase">{item.type}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {item.at ? toLabel(item.at) : "No time set"} {item.at ? `- ${timeUntilLabel(item.at, nowTs)}` : ""}
              </p>
            </div>
          ))}
          {!moduleLoading.brief && !moduleLoading.tasks && !moduleLoading.events && todayTimeline.length === 0 ? (
            <div className="empty-state">
              <div className="empty-illustration"><Clock3 className="h-6 w-6" /></div>
              <p className="text-sm font-semibold text-slate-700">No timeline items yet</p>
              <p className="mt-1 text-xs text-slate-500">Add tasks, events, or reminders to build your day.</p>
            </div>
          ) : null}
        </div>
      </CollapsibleCard>
      ) : null}

      {showAllModules || activeModule === "dashboard" || activeModule === "planner-insights" ? (
      <CollapsibleCard id="planner-insights" title="Planner Insights" icon={<Lightbulb className="h-4 w-4" />}>
        <div className="grid gap-2">
          {plannerInsights.map((item) => (
            <div key={item.id} className="timeline-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-700">{item.title}</p>
                <span className={`chip text-[11px] ${item.level === "warn" ? "chip-warn" : ""}`}>
                  {item.level}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
            </div>
          ))}
        </div>
      </CollapsibleCard>
      ) : null}

      {showAllModules || activeModule === "dashboard" ? (
      <div className="grid gap-6 xl:grid-cols-2">
        <motion.section {...cardMotion} className="panel p-5">
          <h2 className="title-sm mb-3"><CalendarCheck className="mr-2 inline h-4 w-4" /> Calendar + Reminders</h2>
          <div className="grid gap-2 md:grid-cols-2">
            <input className="input" placeholder="Meeting title" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
            <input className="input" type="datetime-local" value={eventStart} onChange={(e) => setEventStart(e.target.value)} />
            <input className="input" type="datetime-local" value={eventReminder} onChange={(e) => setEventReminder(e.target.value)} />
            <button className="btn-secondary inline-flex items-center justify-center gap-2" onClick={createEvent}>
              <AlarmClock className="h-4 w-4" /> Save event
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {events.slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-700">{item.title}</p>
                    <p className="text-[11px] text-slate-400">Start: {toLabel(item.startAt)} {item.reminderAt ? `- Reminder: ${toLabel(item.reminderAt)}` : ""}</p>
                  </div>
                  <button onClick={() => patch(`/api/events/${item.id}`, { isDone: !item.isDone })}>
                    <CheckCircle2 className={`h-4 w-4 ${item.isDone ? "text-emerald-300" : "text-slate-500"}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section {...cardMotion} className="panel p-5">
          <h2 className="title-sm mb-3">Sticky Notes</h2>
          <div className="grid gap-2 md:grid-cols-[1fr_180px_auto]">
            <textarea
              className="input min-h-24"
              value={stickyContent}
              onChange={(e) => setStickyContent(e.target.value)}
              placeholder="Add a quick study note, reminder, doubt, or revision target"
            />
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
              <label className="text-[11px] uppercase tracking-[0.16em] text-cyan-200">Color</label>
              <input className="input mt-2 h-12 w-full p-1" type="color" value={stickyColor} onChange={(e) => setStickyColor(e.target.value)} />
              <p className="mt-2 text-[11px] text-slate-400">{stickyContent.trim().length}/600</p>
            </div>
            <button className="btn-primary px-4 py-2 text-sm" onClick={createSticky}>
              <Highlighter className="mr-2 inline h-4 w-4" /> Save
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button className="chip text-xs" onClick={() => applyStickyTemplate("revision")}>Revision</button>
            <button className="chip text-xs" onClick={() => applyStickyTemplate("exam")}>Exam</button>
            <button className="chip text-xs" onClick={() => applyStickyTemplate("doubt")}>Doubt</button>
            <button className="chip text-xs" onClick={() => applyStickyTemplate("assignment")}>Assignment</button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <button className={`chip ${stickyFilter === "all" ? "chip-active" : ""}`} onClick={() => setStickyFilter("all")}>All</button>
            <button className={`chip ${stickyFilter === "pinned" ? "chip-active" : ""}`} onClick={() => setStickyFilter("pinned")}>Pinned</button>
            <button className={`chip ${stickyFilter === "study" ? "chip-active" : ""}`} onClick={() => setStickyFilter("study")}>Study</button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {moduleLoading.stickies ? renderModuleSkeleton(3) : null}
            {!moduleLoading.stickies && filteredStickies.map((n, index) => {
              const tilt = ((index % 4) - 1.5) * 1.8;
              return (
              <motion.div
                key={n.id}
                drag
                dragMomentum={false}
                dragElastic={0.14}
                dragConstraints={{ left: -80, right: 80, top: -80, bottom: 80 }}
                onDragEnd={(_, info) => void updateStickyPosition(n, info)}
                whileHover={{ y: -8, rotate: tilt + (tilt >= 0 ? 1.2 : -1.2), scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                className="sticky-note-card text-xs text-slate-950"
                style={{ background: n.color, rotate: `${tilt}deg`, x: n.posX ?? 0, y: n.posY ?? 0 }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                      {n.isPinned ? "Pinned" : "Sticky"}
                    </p>
                    <p className="mt-1 line-clamp-5 text-sm font-medium text-slate-900">{n.content}</p>
                  </div>
                  <button className="text-slate-700 transition hover:text-slate-950" onPointerDown={(e) => e.stopPropagation()} onClick={() => patch(`/api/sticky/${n.id}`, { isPinned: !n.isPinned })}>
                    <Pin className={`h-4 w-4 ${n.isPinned ? "fill-current" : ""}`} />
                  </button>
                </div>
                <p className="mt-3 text-[11px] text-slate-700">Updated: {toLabel(n.updatedAt)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="chip border-slate-700/30 bg-white/30 text-slate-900" onPointerDown={(e) => e.stopPropagation()} onClick={() => sendStickyToTask(n)}>
                    Send to task
                  </button>
                  <button className="chip border-slate-700/30 bg-white/30 text-slate-900" onPointerDown={(e) => e.stopPropagation()} onClick={() => setStickyContent(n.content)}>
                    Reuse
                  </button>
                  <button className="chip border-slate-700/30 bg-white/30 text-slate-900" onPointerDown={(e) => e.stopPropagation()} onClick={() => removeItem(`/api/sticky/${n.id}`)}>
                    Delete
                  </button>
                </div>
              </motion.div>
            )})}
            {!moduleLoading.stickies && filteredStickies.length === 0 ? (
              <div className="empty-state sm:col-span-2 xl:col-span-3">
                <div className="empty-illustration"><Pin className="h-6 w-6" /></div>
                <p className="text-sm font-semibold text-slate-700">No sticky notes in this view</p>
                <p className="mt-1 text-xs text-slate-500">Save a reminder, revision cue, or doubt to keep it visible.</p>
              </div>
            ) : null}
          </div>
        </motion.section>
      </div>
      ) : null}

      {showAllModules || activeModule === "notes" ? (
      <div className="grid gap-6 xl:grid-cols-2">
        <CollapsibleCard id="notes" title="Notes" icon={<PenSquare className="h-4 w-4" />} defaultOpen={false}>
          <div className="space-y-2">
            <input ref={noteTitleInputRef} className="input" placeholder="Note title" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} />
            <input className="input" placeholder="Context group" value={noteContext} onChange={(e) => setNoteContext(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              <button className="btn-secondary px-2 py-1 text-xs" onClick={() => applyNoteFormat("**", "**")}>Bold</button>
              <button className="btn-secondary px-2 py-1 text-xs" onClick={() => applyNoteFormat("*", "*")}>Italic</button>
              <button className="btn-secondary px-2 py-1 text-xs" onClick={() => applyNoteFormat("==", "==")}>Highlight</button>
              <button className="btn-secondary px-2 py-1 text-xs" onClick={() => applyNoteFormat("^^", "^^")}>
                <Underline className="mr-1 inline h-3 w-3" /> Underline
              </button>
              <button className="chip text-xs" onClick={() => applyNoteColor("cyan")}>Cyan</button>
              <button className="chip text-xs" onClick={() => applyNoteColor("amber")}>Amber</button>
              <button className="chip text-xs" onClick={() => applyNoteColor("rose")}>Rose</button>
              <button className="btn-secondary px-2 py-1 text-xs" onClick={() => applyNoteFormat("\n# ")}>H1</button>
              <button className="btn-secondary px-2 py-1 text-xs" onClick={() => applyNoteFormat("\n- ")}>Bullet</button>
              <button className="chip text-xs" onClick={() => applyNoteTemplate("summary")}>Summary</button>
              <button className="chip text-xs" onClick={() => applyNoteTemplate("revision")}>Revision</button>
              <button className="chip text-xs" onClick={() => applyNoteTemplate("questions")}>Questions</button>
            </div>
            <button className="subpanel text-left" onClick={() => setNoteEditorOpen(true)}>
              <div className="flex items-center justify-between gap-2">
                <span className="sub-title"><PenSquare className="h-3.5 w-3.5" /> Write note</span>
                <Expand className="h-4 w-4 text-cyan-500" />
              </div>
              <div className="min-h-28 text-sm text-slate-600">
                {noteBody.trim() ? renderRichNoteText(noteBody.slice(0, 240)) : "Click to open large note editor"}
              </div>
            </button>
            <div className="subpanel">
              <span className="sub-title">Live preview</span>
              <div className="min-h-20 text-sm text-slate-600">
                {noteBody.trim() ? renderRichNoteText(noteBody) : "Preview appears here"}
              </div>
            </div>
            <button className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm" onClick={createNote}>
              <Plus className="h-4 w-4" /> Save note
            </button>
          </div>
          <div className="mt-4 grid gap-2">
            <div className="grid gap-2 md:grid-cols-[1fr_auto]">
              <input className="input" placeholder="Search notes or context" value={noteFilter} onChange={(e) => setNoteFilter(e.target.value)} />
              <div className="flex flex-wrap gap-2">
                {noteContextGroups.slice(0, 4).map(([key, count]) => (
                  <button key={key} className="chip text-xs" onClick={() => setNoteFilter(key)}>
                    {key}: {count}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Saved notes</p>
            {moduleLoading.notes ? renderModuleSkeleton(3) : null}
            {!moduleLoading.notes && filteredNotes.map((note) => (
              <div key={note.id} className="saved-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{note.title}</p>
                    <p className="text-[11px] text-cyan-500">{note.contextKey ?? "General"}</p>
                  </div>
                  <button className="text-slate-400 transition hover:text-rose-300" onClick={() => removeItem(`/api/artifacts/${note.id}`)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="line-clamp-4 text-xs text-slate-500">{renderRichNoteText(note.content)}</p>
                {firstUrl(note.content) ? (
                  <button
                    className="mt-2 inline-flex items-center gap-1 text-[11px] text-cyan-200 underline"
                    onClick={() => openExternalLink(firstUrl(note.content) ?? "")}
                  >
                    <ExternalLink className="h-3 w-3" /> Open link
                  </button>
                ) : null}
              </div>
            ))}
            {!moduleLoading.notes && filteredNotes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-illustration"><PenSquare className="h-6 w-6" /></div>
                <p className="text-sm font-semibold text-slate-700">No notes found</p>
                <p className="mt-1 text-xs text-slate-500">Create a note, or change the search/context filter.</p>
              </div>
            ) : null}
          </div>
        </CollapsibleCard>

        <CollapsibleCard id="whiteboard" title="Mind Map Canvas" defaultOpen={false}>
          <div className="grid gap-2 md:grid-cols-[1fr_auto_auto_auto]">
            <input className="input" value={boardTitle} onChange={(e) => setBoardTitle(e.target.value)} placeholder="Mind map name" />
            <input className="input h-11 w-14 p-1" type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} />
            <input className="input h-11 w-20" type="number" min={1} max={12} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} />
            <button className="btn-secondary px-3 text-xs" onClick={clearBoard}>Clear</button>
          </div>
          <button className="mt-3 subpanel text-left" onClick={() => setBoardEditorOpen(true)}>
            <div className="flex items-center justify-between gap-2">
              <span className="sub-title"><PenSquare className="h-3.5 w-3.5" /> Open drawing board</span>
              <Expand className="h-4 w-4 text-cyan-500" />
            </div>
            <div className="rounded-xl border border-slate-800 bg-amber-50/95 p-4">
              <p className="text-sm text-slate-900">Click to draw on a larger canvas popup.</p>
              <p className="mt-2 text-xs text-slate-700">Strokes: {strokes.length}</p>
            </div>
          </button>
          <div className="mt-3 flex gap-2">
            <button className="btn-primary px-4 py-2 text-sm" onClick={saveWhiteboard}>Save snapshot</button>
            <span className="chip">Strokes: {strokes.length}</span>
          </div>
          <div className="mt-3 grid gap-2">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Saved boards</p>
            {boards.slice(0, 5).map((board) => (
              <button key={board.id} className="rounded-lg border border-slate-200 bg-white/80 p-2 text-left text-xs text-slate-600" onClick={() => loadWhiteboard(board)}>
                {board.title}
              </button>
            ))}
          </div>
        </CollapsibleCard>
      </div>
      ) : null}

      {noteEditorOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/75 p-4 backdrop-blur-sm" onClick={() => setNoteEditorOpen(false)}>
          <div className="editor-shell mx-auto mt-4 w-full max-w-6xl p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-500">Focused Writing</p>
                <h3 className="max-w-3xl text-3xl font-black tracking-tight text-slate-700 md:text-4xl">
                  {noteTitle || "Untitled note"}
                </h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="chip">Context: {noteContext || "General"}</span>
                  <span className="chip">Chars: {noteBody.length}</span>
                  <span className="chip">Preview: live</span>
                </div>
              </div>
              <button className="btn-secondary px-5 py-2.5 text-sm" onClick={() => setNoteEditorOpen(false)}>Close</button>
            </div>

            <div className="editor-toolbar mt-6 space-y-3">
              <div className="flex flex-wrap gap-2">
                <button className="editor-chip" onClick={() => applyNoteFormat("**", "**")}>Bold</button>
                <button className="editor-chip" onClick={() => applyNoteFormat("*", "*")}>Italic</button>
                <button className="editor-chip" onClick={() => applyNoteFormat("==", "==")}>Highlight</button>
                <button className="editor-chip" onClick={() => applyNoteFormat("^^", "^^")}>Underline</button>
                <button className="editor-chip" onClick={() => applyNoteFormat("\n# ")}>H1</button>
                <button className="editor-chip" onClick={() => applyNoteFormat("\n- ")}>Bullet</button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="editor-chip" onClick={() => applyNoteColor("cyan")}>Cyan</button>
                <button className="editor-chip" onClick={() => applyNoteColor("amber")}>Amber</button>
                <button className="editor-chip" onClick={() => applyNoteColor("rose")}>Rose</button>
                <button className="editor-chip" onClick={() => applyNoteColor("emerald")}>Emerald</button>
                <button className="editor-chip" onClick={() => applyNoteTemplate("summary")}>Summary</button>
                <button className="editor-chip" onClick={() => applyNoteTemplate("revision")}>Revision</button>
                <button className="editor-chip" onClick={() => applyNoteTemplate("questions")}>Questions</button>
              </div>
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              <section className="editor-paper p-4 md:p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="sub-title"><PenSquare className="h-3.5 w-3.5" /> Writing Surface</span>
                  <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Markdown + formatting</span>
                </div>
                <textarea
                  ref={noteInputRef}
                  className="input min-h-[480px] border-white/10 bg-slate-950/50 text-base leading-7"
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="Write your note with markdown..."
                />
              </section>

              <section className="editor-paper p-4 md:p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="sub-title"><Highlighter className="h-3.5 w-3.5" /> Live Preview</span>
                  <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Readable view</span>
                </div>
                <div className="min-h-[480px] rounded-2xl border border-slate-200 bg-white/88 p-5 text-sm leading-7 text-slate-700">
                  {noteBody.trim() ? renderRichNoteText(noteBody) : (
                    <div className="space-y-2 text-slate-500">
                      <p>Preview appears here.</p>
                      <p>Use highlight, underline, colors, headings, and bullets.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}

      {boardEditorOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/75 p-4 backdrop-blur-sm" onClick={() => setBoardEditorOpen(false)}>
          <div className="editor-shell mx-auto mt-4 w-full max-w-6xl p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-500">Visual Thinking</p>
                <h3 className="text-3xl font-black tracking-tight text-slate-700 md:text-4xl">{boardTitle}</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="chip">Brush: {brushSize}</span>
                  <span className="chip">Strokes: {strokes.length}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary px-4 py-2 text-sm" onClick={clearBoard}>Clear</button>
                <button className="btn-secondary px-4 py-2 text-sm" onClick={() => setBoardEditorOpen(false)}>Close</button>
              </div>
            </div>
            <div className="editor-toolbar mt-6">
              <div className="grid gap-3 md:grid-cols-[1fr_100px_120px]">
                <input className="input" value={boardTitle} onChange={(e) => setBoardTitle(e.target.value)} placeholder="Mind map name" />
                <input className="input h-11 w-full p-1" type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} />
                <input className="input h-11 w-full" type="number" min={1} max={12} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} />
              </div>
            </div>
            <div className="editor-paper mt-6 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="sub-title"><PenSquare className="h-3.5 w-3.5" /> Canvas</span>
                <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Draw, map, connect</span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50 to-white">
              <canvas
                ref={canvasRef}
                className="h-[520px] w-full touch-none"
                onPointerDown={startStroke}
                onPointerMove={moveStroke}
                onPointerUp={endStroke}
                onPointerLeave={endStroke}
              />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="btn-primary px-4 py-2 text-sm" onClick={saveWhiteboard}>Save snapshot</button>
              <span className="chip">Strokes: {strokes.length}</span>
            </div>
          </div>
        </div>
      ) : null}

      {showModule("videos") ? (
      <CollapsibleCard id="videos" title="YouTube Vault" icon={<Youtube className="h-4 w-4" />} defaultOpen={false}>
        <div className="grid gap-2 md:grid-cols-2">
          <input ref={videoTitleInputRef} className="input" placeholder="Video title" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} />
          <input className="input" placeholder="YouTube URL" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <textarea className="input min-h-24" placeholder="Your comments / insights" value={videoComment} onChange={(e) => setVideoComment(e.target.value)} />
          <textarea className="input min-h-24" placeholder="Tags (comma separated)" value={videoTags} onChange={(e) => setVideoTags(e.target.value)} />
        </div>
        <div className="mt-3">
          <button disabled={focusLimitReached} className="btn-primary px-4 py-2 text-sm disabled:opacity-40" onClick={createVideo}>
            Save video
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <button className={`chip ${videoView === "all" ? "ring-1 ring-cyan-300/60" : ""}`} onClick={() => setVideoView("all")}>All</button>
          <button className={`chip ${videoView === "pending" ? "ring-1 ring-cyan-300/60" : ""}`} onClick={() => setVideoView("pending")}>Pending</button>
          <button className={`chip ${videoView === "completed" ? "ring-1 ring-cyan-300/60" : ""}`} onClick={() => setVideoView("completed")}>Completed</button>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {moduleLoading.videos ? renderModuleSkeleton(4) : null}
          {!moduleLoading.videos && [...filteredVideos].sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted)).map((video) => (
            <div key={video.id} className="saved-card">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-xs font-semibold ${video.isCompleted ? "text-emerald-500 line-through" : "text-slate-700"}`}>{video.title}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleVideoComplete(video)}>
                    <CheckCircle2 className={`h-4 w-4 ${video.isCompleted ? "text-emerald-300" : "text-slate-500"}`} />
                  </button>
                  <button className="text-slate-400 transition hover:text-rose-300" onClick={() => removeItem(`/api/videos/${video.id}`)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="line-clamp-2 text-xs text-slate-500">{video.comment || video.url}</p>
              {video.tags ? <p className="mt-1 text-[11px] text-cyan-500">{video.tags}</p> : null}
              {video.isCompleted ? <p className="mt-1 text-[11px] text-emerald-300">Completed</p> : <p className="mt-1 text-[11px] text-amber-300">Pending</p>}
              <button className="mt-2 inline-flex items-center gap-1 text-[11px] text-cyan-200 underline" onClick={() => openExternalLink(video.url)}>
                <ExternalLink className="h-3 w-3" /> Open video
              </button>
            </div>
          ))}
          {!moduleLoading.videos && filteredVideos.length === 0 ? (
            <div className="empty-state md:col-span-2">
              <div className="empty-illustration"><Youtube className="h-6 w-6" /></div>
              <p className="text-sm font-semibold text-slate-700">No videos in this view</p>
              <p className="mt-1 text-xs text-slate-500">Save a YouTube lecture or switch the current video filter.</p>
            </div>
          ) : null}
        </div>
      </CollapsibleCard>
      ) : null}

      {showModule("files") ? (
      <CollapsibleCard id="files" title="Files Organizer" icon={<FileStack className="h-4 w-4" />} defaultOpen={false}>
        <div className="grid gap-2 md:grid-cols-2">
          <input ref={fileNameInputRef} className="input" placeholder="File name" value={fileName} onChange={(e) => setFileName(e.target.value)} />
          <input className="input" placeholder="Path or URL" value={filePath} onChange={(e) => setFilePath(e.target.value)} />
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-[1fr_auto]">
          <input
            className="input"
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setSelectedFile(file);
              if (file && !fileName.trim()) setFileName(file.name);
            }}
          />
          <button
            className="btn-secondary px-4 py-2 text-sm"
            onClick={() => {
              if (!selectedFile) return;
              if (!fileName.trim()) setFileName(selectedFile.name);
            }}
          >
            Use Selected File
          </button>
        </div>
        {selectedFile ? <p className="mt-1 text-xs text-cyan-200">Selected: {selectedFile.name}</p> : null}
        {fileNotice ? <p className="mt-2 text-xs text-emerald-300">{fileNotice}</p> : null}
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <input className="input" placeholder="Category (optional)" value={fileCategory} onChange={(e) => setFileCategory(e.target.value)} />
          <input className="input" placeholder="Subject (e.g., Physics)" value={fileSubject} onChange={(e) => setFileSubject(e.target.value)} />
          <input className="input" placeholder="Tags (optional, comma separated)" value={fileTags} onChange={(e) => setFileTags(e.target.value)} />
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <input className="input" placeholder="Last position (e.g., Page 42)" value={fileLastPosition} onChange={(e) => setFileLastPosition(e.target.value)} />
          <input className="input" placeholder="Progress note (e.g., left at derivation)" value={fileProgressNote} onChange={(e) => setFileProgressNote(e.target.value)} />
        </div>
        <div className="mt-3">
          <button className="btn-primary px-4 py-2 text-sm" onClick={createFileItem} disabled={uploadingFile}>
            {uploadingFile ? "Uploading..." : "Save file"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500">Sort:</span>
          <button className={`chip ${fileSort === "new" ? "ring-1 ring-cyan-300/60" : ""}`} onClick={() => setFileSort("new")}>Newest</button>
          <button className={`chip ${fileSort === "old" ? "ring-1 ring-cyan-300/60" : ""}`} onClick={() => setFileSort("old")}>Oldest</button>
          <button className={`chip ${fileSort === "az" ? "ring-1 ring-cyan-300/60" : ""}`} onClick={() => setFileSort("az")}>A to Z</button>
          <button className={`chip ${fileSort === "za" ? "ring-1 ring-cyan-300/60" : ""}`} onClick={() => setFileSort("za")}>Z to A</button>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {fileSubjectGroups.map(([subject, meta]) => (
            <div key={subject} className="subpanel">
              <h3 className="sub-title"><FolderOpen className="h-3.5 w-3.5" /> {subject}</h3>
              <p className="text-lg font-semibold text-slate-700">{meta.count} files</p>
              <p className="text-xs text-slate-500">{meta.completed}/{meta.count} completed</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {moduleLoading.files ? renderModuleSkeleton(4) : null}
          {!moduleLoading.files && sortedFiles.map((item) => (
            <div key={item.id} className="saved-card">
              <div className="flex items-center justify-between gap-2">
                <p className={`text-xs font-semibold ${item.isCompleted ? "text-emerald-500 line-through" : "text-slate-700"}`}>{item.name}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleFileComplete(item)}>
                    <CheckCircle2 className={`h-4 w-4 ${item.isCompleted ? "text-emerald-300" : "text-slate-500"}`} />
                  </button>
                  <button className="text-slate-400 transition hover:text-rose-300" onClick={() => removeItem(`/api/files/${item.id}`)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="line-clamp-1 text-[11px] text-slate-500">{item.pathOrUrl}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {item.hasStoredFile ? <span className="chip text-[10px]">Stored</span> : <span className="chip text-[10px]">Link</span>}
                {item.mimeType ? <span className="chip text-[10px]">{item.mimeType.split("/").pop()}</span> : null}
                {item.sizeBytes ? <span className="chip text-[10px]">{Math.max(1, Math.round(item.sizeBytes / 1024))} KB</span> : null}
              </div>
              <p className="mt-1 text-[11px] text-cyan-500">
                {(item.category ?? "general").toUpperCase()}
                {item.subject ? ` | ${item.subject}` : ""}
                {item.tags ? ` | ${item.tags}` : ""}
              </p>
              {item.lastPosition ? <p className="text-[11px] text-amber-200">Last position: {item.lastPosition}</p> : null}
              {item.progressNote ? <p className="line-clamp-2 text-[11px] text-slate-500">{item.progressNote}</p> : null}
              <p className={`text-[11px] ${item.isCompleted ? "text-emerald-300" : "text-amber-300"}`}>{item.isCompleted ? "Completed" : "In progress"}</p>
              <button className="mt-2 inline-flex items-center gap-1 text-[11px] text-cyan-200 underline" onClick={() => openFileItem(item)}>
                <ExternalLink className="h-3 w-3" /> Open file
              </button>
            </div>
          ))}
          {!moduleLoading.files && sortedFiles.length === 0 ? (
            <div className="empty-state md:col-span-2">
              <div className="empty-illustration"><FileStack className="h-6 w-6" /></div>
              <p className="text-sm font-semibold text-slate-700">No files saved yet</p>
              <p className="mt-1 text-xs text-slate-500">Upload notes, PDFs, or links and group them by subject.</p>
            </div>
          ) : null}
        </div>
      </CollapsibleCard>
      ) : null}

      {showModule("search") ? (
      <CollapsibleCard
        id="search"
        title="Unified Search"
        icon={<Search className="h-4 w-4" />}
        right={<span className="text-xs text-slate-500">{searchLoading ? "Searching..." : `${searchCounts.all ?? 0} results`}</span>}
      >
        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
          <input className="input" placeholder="Search notes, files, videos, events..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <select className="input md:w-44" value={searchKind} onChange={(e) => setSearchKind(e.target.value)}>
            <option value="all">All</option>
            <option value="artifact">Notes & Tasks</option>
            <option value="event">Events</option>
            <option value="sticky">Sticky</option>
            <option value="video">Videos</option>
            <option value="file">Files</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className="chip">All: {searchCounts.all ?? 0}</span>
          <span className="chip">Artifacts: {searchCounts.artifact ?? 0}</span>
          <span className="chip">Events: {searchCounts.event ?? 0}</span>
          <span className="chip">Sticky: {searchCounts.sticky ?? 0}</span>
          <span className="chip">Videos: {searchCounts.video ?? 0}</span>
          <span className="chip">Files: {searchCounts.file ?? 0}</span>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {moduleLoading.search ? renderModuleSkeleton(4) : null}
          {!moduleLoading.search && searchResults.slice(0, 12).map((item) => (
            <div key={`${item.kind}-${item.id}`} className="rounded-lg border border-white/10 bg-slate-900/60 p-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-cyan-200">{item.kind}</p>
              <p className="text-xs font-semibold text-slate-700">{item.title}</p>
              <p className="line-clamp-2 text-xs text-slate-500">{item.preview || "No preview"}</p>
            </div>
          ))}
        </div>
        {!searchLoading && !moduleLoading.search && searchQuery.trim() && searchResults.length === 0 ? (
          <p className="mt-3 text-xs text-slate-400">No results found. Try different keywords or switch to All.</p>
        ) : null}
      </CollapsibleCard>
      ) : null}

      {showModule("focus-lab") ? (
      <CollapsibleCard id="focus-lab" title="Focus Lab" icon={<Timer className="h-4 w-4" />}>
        <div className="grid gap-2 md:grid-cols-4">
          <input className="input" type="number" value={pomodoroMin} onChange={(e) => setPomodoroMin(Number(e.target.value))} />
          <input className="input" type="number" value={breakMin} onChange={(e) => setBreakMin(Number(e.target.value))} />
          <input className="input" type="number" value={screenLimitMin} onChange={(e) => setScreenLimitMin(Number(e.target.value))} />
          <input className="input" type="number" min={1} value={focusLockMin} onChange={(e) => setFocusLockMin(Number(e.target.value))} />
        </div>
        <textarea className="input mt-2 min-h-20" value={blockedSites} onChange={(e) => setBlockedSites(e.target.value)} />
        {focusWarning ? (
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-300/40 bg-amber-500/10 p-2 text-xs text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{focusWarning}</p>
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-primary px-4 py-2 text-sm" onClick={toggleTimer}>
            {timerRunning ? "Pause" : "Start"}
          </button>
          <button className="btn-secondary px-4 py-2 text-sm" onClick={resetTimer}>
            Reset
          </button>
          <button className="btn-secondary px-4 py-2 text-sm" onClick={toggleFocusMode}>
            {focusMode ? "Focus ON" : "Focus OFF"}
          </button>
          <button
            className="btn-secondary px-4 py-2 text-sm"
            onClick={() => {
              setFocusMode(false);
              setTimerPhase("break");
              setTimerSeconds(breakMin * 60);
              setTimerRunning(true);
            }}
          >
            Start Break
          </button>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="focus-ring-panel">
            <div className="progress-ring progress-ring-lg" style={{ ["--progress" as string]: `${timerProgress}%` }}>
              <div className="progress-ring-inner">
                <span>{timerLabel}</span>
              </div>
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-cyan-200">Phase: {timerPhase}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button className={`chip ${timerPhase === "work" ? "chip-active" : ""}`} onClick={() => { setTimerPhase("work"); setTimerSeconds(pomodoroMin * 60); }}>Focus {pomodoroMin}m</button>
              <button className="chip" onClick={() => { setTimerPhase("break"); setBreakMin(5); setTimerSeconds(5 * 60); }}>Short 5m</button>
              <button className="chip" onClick={() => { setTimerPhase("break"); setBreakMin(15); setTimerSeconds(15 * 60); }}>Long 15m</button>
            </div>
          </div>
          <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
            <p className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Lock className="h-3.5 w-3.5" />
              Lock left: {Math.max(0, Math.floor(focusLockRemainingSec / 60))}:{String(Math.max(0, focusLockRemainingSec % 60)).padStart(2, "0")}
            </p>
            <p className={`text-xs ${focusLimitReached ? "text-red-500" : "text-slate-400"}`}>
              Goal {focusUsedMinutes}/{profilePrefs.studyGoalMin} min
            </p>
            <p className="text-xs text-cyan-200">
              Streak: {studyStreak.days} day{studyStreak.days === 1 ? "" : "s"}
              {studyStreak.lastDay ? ` (last: ${toLabel(studyStreak.lastDay)})` : ""}
            </p>
            <div className="flex gap-1">
              {Array.from({ length: 7 }).map((_, index) => (
                <span key={index} className={`session-dot ${index < Math.min(studyStreak.days, 7) ? "session-dot-active" : ""}`} />
              ))}
            </div>
            <div className="grid gap-2">
              {focusSessions.slice(0, 5).map((session) => (
                <div key={session.id} className="rounded-lg border border-white/10 bg-slate-900/60 p-2">
                  <p className="text-xs text-slate-700">{session.durationMin} min focus / {session.breakMin} min break</p>
                  <p className="text-[11px] text-slate-400">Started: {toLabel(session.startedAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">Sessions today: {focusSessions.length}</p>
      </CollapsibleCard>
      ) : null}

      {paletteOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/70 p-4 backdrop-blur-sm" onClick={() => setPaletteOpen(false)}>
          <div className="mx-auto mt-10 w-full max-w-2xl rounded-2xl border border-white/15 bg-slate-900/95 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-700">Command Palette</p>
              <span className="chip text-[11px]">Ctrl/Cmd + K</span>
            </div>
            <input
              autoFocus
              className="input"
              placeholder="Type a command..."
              value={paletteQuery}
              onChange={(e) => setPaletteQuery(e.target.value)}
            />
            <div className="mt-3 grid max-h-80 gap-2 overflow-auto">
              {filteredCommands.slice(0, 12).map((item) => (
                <button
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-left hover:bg-slate-800/70"
                  onClick={() => {
                    item.run();
                    setPaletteOpen(false);
                  }}
                >
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-cyan-200">{item.hint}</span>
                </button>
              ))}
              {filteredCommands.length === 0 ? <p className="text-xs text-slate-400">No command found.</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
