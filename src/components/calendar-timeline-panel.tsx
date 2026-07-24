"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  ListTodo,
  Plus,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { getFirebaseIdToken, readStoredSession } from "@/lib/firebase-client";

export type CalendarItem = {
  id: string;
  type: "task" | "deadline" | "pdf_revision" | "event" | "reminder";
  title: string;
  description: string | null;
  date: string;
  isCompleted: boolean;
  targetUrl: string | null;
  sourceId: string;
  meta?: {
    subject?: string;
    category?: string;
    lastPosition?: string;
    contextKey?: string;
    kind?: string;
    hasStoredFile?: boolean;
  };
};

type ViewMode = "day" | "week" | "month" | "timeline";

export function CalendarTimelinePanel() {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);

  // Filters
  const [showTasks, setShowTasks] = useState(true);
  const [showDeadlines, setShowDeadlines] = useState(true);
  const [showPdfRevisions, setShowPdfRevisions] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState("all");

  // New item modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState<"task" | "deadline" | "pdf_revision">("task");
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSubject, setNewSubject] = useState("General");
  const [creating, setCreating] = useState(false);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const session = readStoredSession();
      const token = (await getFirebaseIdToken()) || session?.idToken;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch("/api/calendar", { headers });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } catch (err) {
      console.error("Failed to load calendar data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const session = readStoredSession();
        const token = (await getFirebaseIdToken()) || session?.idToken;
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch("/api/calendar", { headers });
        if (res.ok && active) {
          const data = await res.json();
          setItems(data.items ?? []);
        }
      } catch (err) {
        console.error("Failed to load calendar data", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  // Extract unique subjects for filter
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.meta?.subject) set.add(item.meta.subject);
      if (item.meta?.contextKey) set.add(item.meta.contextKey.replace("Study/", ""));
    });
    return Array.from(set).filter(Boolean);
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (!showTasks && item.type === "task") return false;
      if (!showDeadlines && (item.type === "deadline" || item.type === "event" || item.type === "reminder")) return false;
      if (!showPdfRevisions && item.type === "pdf_revision") return false;
      if (!showCompleted && item.isCompleted) return false;
      if (subjectFilter !== "all") {
        const subj = item.meta?.subject || item.meta?.contextKey?.replace("Study/", "");
        if (subj !== subjectFilter) return false;
      }
      return true;
    });
  }, [items, showTasks, showDeadlines, showPdfRevisions, showCompleted, subjectFilter]);

  // Date Navigation Helpers
  const navigatePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === "day") next.setDate(next.getDate() - 1);
    else if (viewMode === "week") next.setDate(next.getDate() - 7);
    else if (viewMode === "month") next.setMonth(next.getMonth() - 1);
    setCurrentDate(next);
  };

  const navigateNext = () => {
    const next = new Date(currentDate);
    if (viewMode === "day") next.setDate(next.getDate() + 1);
    else if (viewMode === "week") next.setDate(next.getDate() + 7);
    else if (viewMode === "month") next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // Toggle item completion state
  const toggleItemCompletion = async (item: CalendarItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextState = !item.isCompleted;

    // Optimistic UI update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isCompleted: nextState } : i))
    );
    if (selectedItem?.id === item.id) {
      setSelectedItem((prev) => (prev ? { ...prev, isCompleted: nextState } : null));
    }

    try {
      const session = readStoredSession();
      const token = (await getFirebaseIdToken()) || session?.idToken;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      if (item.type === "task") {
        await fetch(`/api/artifacts/${item.sourceId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ isDone: nextState }),
        });
      } else if (item.type === "pdf_revision") {
        await fetch(`/api/files/${item.sourceId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ isCompleted: nextState }),
        });
      } else if (item.type === "deadline" || item.type === "event") {
        await fetch(`/api/events/${item.sourceId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ isDone: nextState }),
        });
      } else if (item.type === "reminder") {
        await fetch(`/api/notifications/reminders/${item.sourceId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ isRead: nextState }),
        });
      }
    } catch (err) {
      console.error("Failed to update item completion", err);
    }
  };

  // Create new task or deadline
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);

    try {
      const session = readStoredSession();
      const token = (await getFirebaseIdToken()) || session?.idToken;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const targetDateIso = newDate ? new Date(newDate).toISOString() : new Date().toISOString();

      if (createType === "task") {
        await fetch("/api/artifacts", {
          method: "POST",
          headers,
          body: JSON.stringify({
            title: newTitle.trim(),
            content: newDescription.trim() || `Study: ${newSubject}`,
            type: "TASK",
            contextKey: `Study/${newSubject}`,
            dueAt: targetDateIso,
          }),
        });
      } else if (createType === "deadline") {
        await fetch("/api/events", {
          method: "POST",
          headers,
          body: JSON.stringify({
            title: newTitle.trim(),
            notes: newDescription.trim() || undefined,
            startAt: targetDateIso,
            isImportant: true,
          }),
        });
      } else if (createType === "pdf_revision") {
        await fetch("/api/files", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: newTitle.trim().endsWith(".pdf") ? newTitle.trim() : `${newTitle.trim()}.pdf`,
            pathOrUrl: "https://example.com/pdf-study-material",
            subject: newSubject,
            category: "study-material",
            progressNote: newDescription.trim() || "Scheduled PDF Revision",
          }),
        });
      }

      setCreateModalOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewDate("");
      await fetchFeed();
    } catch (err) {
      console.error("Failed to create item", err);
    } finally {
      setCreating(false);
    }
  };

  // Click handler to open linked PDF or Task
  const handleItemClick = (item: CalendarItem) => {
    setSelectedItem(item);
  };

  const openLinkedResource = (item: CalendarItem) => {
    if (item.targetUrl) {
      if (item.targetUrl.startsWith("/api/files/") || item.targetUrl.startsWith("http")) {
        window.open(item.targetUrl, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = item.targetUrl;
      }
    }
  };

  // Helper formatting functions
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const getItemBadgeClass = (type: CalendarItem["type"]) => {
    switch (type) {
      case "task":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "deadline":
      case "event":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "pdf_revision":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "reminder":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getItemIcon = (type: CalendarItem["type"]) => {
    switch (type) {
      case "task":
        return <ListTodo className="h-3.5 w-3.5 text-emerald-600" />;
      case "deadline":
      case "event":
        return <AlertCircle className="h-3.5 w-3.5 text-amber-600" />;
      case "pdf_revision":
        return <FileText className="h-3.5 w-3.5 text-blue-600" />;
      case "reminder":
        return <Clock className="h-3.5 w-3.5 text-purple-600" />;
    }
  };

  const getTypeLabel = (type: CalendarItem["type"]) => {
    switch (type) {
      case "task":
        return "Task";
      case "deadline":
      case "event":
        return "Deadline";
      case "pdf_revision":
        return "PDF Revision";
      case "reminder":
        return "Reminder";
    }
  };

  // Header Title
  const getHeaderTitle = () => {
    if (viewMode === "day") {
      return currentDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    if (viewMode === "week") {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    if (viewMode === "month") {
      return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    return "Timeline Feed";
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
              <CalendarIcon className="h-3.5 w-3.5" /> Calendar & Timeline
            </span>
            <span className="text-xs font-medium text-slate-500">
              {filteredItems.length} items scheduled
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {getHeaderTitle()}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh button */}
          <button
            type="button"
            onClick={fetchFeed}
            disabled={loading}
            className="btn-secondary px-3 py-1.5 text-xs text-slate-700"
            title="Refresh feed"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Add Item Button */}
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" /> Add Event / Task
          </button>

          {/* View Mode Selector */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-medium text-slate-600">
            {(["day", "week", "month", "timeline"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`rounded-lg px-3 py-1 capitalize transition ${
                  viewMode === mode
                    ? "bg-white font-semibold text-blue-600 shadow-sm"
                    : "hover:text-slate-900"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Date Navigation */}
          {viewMode !== "timeline" && (
            <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={navigatePrev}
                className="rounded-lg p-1 text-slate-600 hover:bg-slate-100"
                title="Previous"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={navigateToday}
                className="px-2 py-0.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md"
              >
                Today
              </button>
              <button
                type="button"
                onClick={navigateNext}
                className="rounded-lg p-1 text-slate-600 hover:bg-slate-100"
                title="Next"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50/80 p-3.5 border border-slate-200/60">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1 font-semibold text-slate-600">
            <Filter className="h-3.5 w-3.5 text-slate-400" /> Filters:
          </span>

          <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
            <input
              type="checkbox"
              checked={showTasks}
              onChange={(e) => setShowTasks(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Tasks
            </span>
          </label>

          <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
            <input
              type="checkbox"
              checked={showDeadlines}
              onChange={(e) => setShowDeadlines(e.target.checked)}
              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Deadlines
            </span>
          </label>

          <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
            <input
              type="checkbox"
              checked={showPdfRevisions}
              onChange={(e) => setShowPdfRevisions(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500" /> PDF Revisions
            </span>
          </label>

          <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded border-slate-300 text-slate-600 focus:ring-slate-500"
            />
            <span>Show Completed</span>
          </label>
        </div>

        {availableSubjects.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Subject:</span>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Subjects</option>
              {availableSubjects.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area Views */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" /> Loading schedule...
          </div>
        </div>
      ) : (
        <>
          {/* MONTH VIEW */}
          {viewMode === "month" && (
            <MonthView
              currentDate={currentDate}
              items={filteredItems}
              onItemClick={handleItemClick}
              isSameDay={isSameDay}
              getItemBadgeClass={getItemBadgeClass}
              getItemIcon={getItemIcon}
            />
          )}

          {/* WEEK VIEW */}
          {viewMode === "week" && (
            <WeekView
              currentDate={currentDate}
              items={filteredItems}
              onItemClick={handleItemClick}
              onToggleComplete={toggleItemCompletion}
              isSameDay={isSameDay}
              getItemBadgeClass={getItemBadgeClass}
              getItemIcon={getItemIcon}
            />
          )}

          {/* DAY VIEW */}
          {viewMode === "day" && (
            <DayView
              currentDate={currentDate}
              items={filteredItems}
              onItemClick={handleItemClick}
              onToggleComplete={toggleItemCompletion}
              isSameDay={isSameDay}
              getItemBadgeClass={getItemBadgeClass}
              getItemIcon={getItemIcon}
            />
          )}

          {/* TIMELINE VIEW */}
          {viewMode === "timeline" && (
            <TimelineView
              items={filteredItems}
              onItemClick={handleItemClick}
              onToggleComplete={toggleItemCompletion}
              getItemBadgeClass={getItemBadgeClass}
              getItemIcon={getItemIcon}
              getTypeLabel={getTypeLabel}
            />
          )}
        </>
      )}

      {/* ITEM DETAIL MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${getItemBadgeClass(
                    selectedItem.type
                  )}`}
                >
                  {getItemIcon(selectedItem.type)} {getTypeLabel(selectedItem.type)}
                </span>

                {selectedItem.meta?.subject && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {selectedItem.meta.subject}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h3 className={`text-xl font-bold text-slate-900 ${selectedItem.isCompleted ? "line-through text-slate-400" : ""}`}>
                {selectedItem.title}
              </h3>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <Clock className="h-3.5 w-3.5 text-blue-600" />
                  {new Date(selectedItem.date).toLocaleString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>

                <span className="flex items-center gap-1">
                  Status:{" "}
                  <span
                    className={`font-semibold ${
                      selectedItem.isCompleted ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {selectedItem.isCompleted ? "Completed" : "Pending"}
                  </span>
                </span>
              </div>

              {selectedItem.description && (
                <div className="rounded-xl bg-slate-50 p-3.5 text-sm text-slate-700 border border-slate-200/80 leading-relaxed">
                  {selectedItem.description}
                </div>
              )}

              {selectedItem.meta?.lastPosition && (
                <p className="text-xs text-slate-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  📌 <strong>PDF Bookmark / Last Position:</strong> {selectedItem.meta.lastPosition}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => toggleItemCompletion(selectedItem)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  selectedItem.isCompleted
                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                {selectedItem.isCompleted ? "Mark as Pending" : "Mark Completed"}
              </button>

              {selectedItem.targetUrl && (
                <button
                  type="button"
                  onClick={() => openLinkedResource(selectedItem)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                >
                  <ExternalLink className="h-4 w-4" />
                  {selectedItem.type === "pdf_revision" ? "Open PDF Document" : "Open Linked Resource"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW ITEM MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleCreateItem}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" /> Create Scheduled Item
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Item Category</label>
              <div className="grid grid-cols-3 gap-2">
                {(["task", "deadline", "pdf_revision"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCreateType(type)}
                    className={`rounded-xl py-2 px-2 text-xs font-semibold border transition text-center capitalize ${
                      createType === type
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {type === "pdf_revision" ? "PDF Revision" : type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
              <input
                type="text"
                required
                placeholder={
                  createType === "pdf_revision"
                    ? "e.g. Organic Chemistry Chapter 4.pdf"
                    : "e.g. Physics Problem Set 3"
                }
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Physics, Math"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Revision Notes</label>
              <textarea
                rows={3}
                placeholder="Add notes, key concepts to revise, or problem numbers..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? "Saving..." : "Save to Schedule"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// MONTH VIEW COMPONENT
// ----------------------------------------------------------------------
function MonthView({
  currentDate,
  items,
  onItemClick,
  isSameDay,
  getItemBadgeClass,
  getItemIcon,
}: {
  currentDate: Date;
  items: CalendarItem[];
  onItemClick: (item: CalendarItem) => void;
  isSameDay: (d1: Date, d2: Date) => boolean;
  getItemBadgeClass: (type: CalendarItem["type"]) => string;
  getItemIcon: (type: CalendarItem["type"]) => React.ReactNode;
}) {
  const today = new Date();

  // Generate calendar days for current month view
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
  const daysInMonth = lastDayOfMonth.getDate();

  // Days array
  const calendarDays: Array<{ date: Date; isCurrentMonth: boolean }> = [];

  // Previous month padding
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    calendarDays.push({ date: d, isCurrentMonth: false });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    calendarDays.push({ date: d, isCurrentMonth: true });
  }

  // Next month padding to complete 35 or 42 cells
  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    calendarDays.push({ date: d, isCurrentMonth: false });
  }

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-600 py-2.5">
        {daysOfWeek.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-200/80">
        {calendarDays.map(({ date, isCurrentMonth }, idx) => {
          const isToday = isSameDay(date, today);
          const dayItems = items.filter((item) => isSameDay(new Date(item.date), date));

          return (
            <div
              key={idx}
              className={`min-h-[110px] p-2 transition ${
                isCurrentMonth ? "bg-white" : "bg-slate-50/50 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-bold h-6 w-6 flex items-center justify-center rounded-full ${
                    isToday
                      ? "bg-blue-600 text-white shadow-xs"
                      : isCurrentMonth
                      ? "text-slate-800"
                      : "text-slate-400"
                  }`}
                >
                  {date.getDate()}
                </span>
                {dayItems.length > 0 && (
                  <span className="text-[10px] font-semibold text-slate-400">
                    {dayItems.length}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {dayItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onItemClick(item)}
                    className={`group flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium border cursor-pointer transition hover:opacity-90 ${getItemBadgeClass(
                      item.type
                    )} ${item.isCompleted ? "opacity-50 line-through" : ""}`}
                  >
                    {getItemIcon(item.type)}
                    <span className="truncate flex-1">{item.title}</span>
                  </div>
                ))}

                {dayItems.length > 3 && (
                  <div className="text-[10px] font-semibold text-blue-600 pl-1">
                    +{dayItems.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// WEEK VIEW COMPONENT
// ----------------------------------------------------------------------
function WeekView({
  currentDate,
  items,
  onItemClick,
  onToggleComplete,
  isSameDay,
  getItemBadgeClass,
  getItemIcon,
}: {
  currentDate: Date;
  items: CalendarItem[];
  onItemClick: (item: CalendarItem) => void;
  onToggleComplete: (item: CalendarItem, e: React.MouseEvent) => void;
  isSameDay: (d1: Date, d2: Date) => boolean;
  getItemBadgeClass: (type: CalendarItem["type"]) => string;
  getItemIcon: (type: CalendarItem["type"]) => React.ReactNode;
}) {
  const today = new Date();

  // Get current week days (Sun-Sat)
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
      {weekDays.map((date, idx) => {
        const isToday = isSameDay(date, today);
        const dayItems = items.filter((item) => isSameDay(new Date(item.date), date));

        return (
          <div
            key={idx}
            className={`rounded-2xl border p-3 flex flex-col min-h-[300px] ${
              isToday
                ? "border-blue-300 bg-blue-50/20 shadow-sm"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="border-b border-slate-100 pb-2 mb-2 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </p>
                <p
                  className={`text-lg font-bold ${
                    isToday ? "text-blue-600" : "text-slate-800"
                  }`}
                >
                  {date.getDate()}
                </p>
              </div>
              <span className="text-xs font-medium text-slate-400">{dayItems.length} items</span>
            </div>

            <div className="space-y-2 flex-1">
              {dayItems.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic py-4 text-center">No tasks scheduled</p>
              ) : (
                dayItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onItemClick(item)}
                    className={`rounded-xl p-2.5 text-xs font-medium border cursor-pointer transition hover:shadow-xs space-y-1 ${getItemBadgeClass(
                      item.type
                    )} ${item.isCompleted ? "opacity-60 line-through" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 font-semibold">
                        {getItemIcon(item.type)}
                        <span className="truncate max-w-[110px]">{item.title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => onToggleComplete(item, e)}
                        className="text-slate-400 hover:text-emerald-600"
                        title={item.isCompleted ? "Mark pending" : "Mark done"}
                      >
                        <CheckCircle2
                          className={`h-4 w-4 ${
                            item.isCompleted ? "fill-emerald-600 text-white" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {item.meta?.subject && (
                      <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-md bg-white/60 font-semibold">
                        {item.meta.subject}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ----------------------------------------------------------------------
// DAY VIEW COMPONENT
// ----------------------------------------------------------------------
function DayView({
  currentDate,
  items,
  onItemClick,
  onToggleComplete,
  isSameDay,
  getItemBadgeClass,
  getItemIcon,
}: {
  currentDate: Date;
  items: CalendarItem[];
  onItemClick: (item: CalendarItem) => void;
  onToggleComplete: (item: CalendarItem, e: React.MouseEvent) => void;
  isSameDay: (d1: Date, d2: Date) => boolean;
  getItemBadgeClass: (type: CalendarItem["type"]) => string;
  getItemIcon: (type: CalendarItem["type"]) => React.ReactNode;
}) {
  const dayItems = items.filter((item) => isSameDay(new Date(item.date), currentDate));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Schedule for {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h3>
          <p className="text-xs text-slate-500">
            {dayItems.length} items scheduled on this date
          </p>
        </div>
      </div>

      {dayItems.length === 0 ? (
        <div className="py-12 text-center text-slate-400 space-y-2">
          <CalendarIcon className="mx-auto h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium">No tasks, deadlines or PDF revisions scheduled for this day.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onItemClick(item)}
              className={`flex items-center justify-between gap-4 rounded-xl p-4 border cursor-pointer transition hover:shadow-xs ${getItemBadgeClass(
                item.type
              )} ${item.isCompleted ? "opacity-60" : ""}`}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => onToggleComplete(item, e)}
                  className="text-slate-400 hover:text-emerald-600 transition"
                >
                  <CheckCircle2
                    className={`h-5 w-5 ${
                      item.isCompleted ? "fill-emerald-600 text-white" : ""
                    }`}
                  />
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      {getItemIcon(item.type)}
                      <span className={item.isCompleted ? "line-through text-slate-500" : ""}>
                        {item.title}
                      </span>
                    </span>
                    {item.meta?.subject && (
                      <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                        {item.meta.subject}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-1">{item.description}</p>
                  )}
                </div>
              </div>

              <div className="text-right text-xs font-semibold text-slate-500">
                {new Date(item.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// TIMELINE VIEW COMPONENT
// ----------------------------------------------------------------------
function TimelineView({
  items,
  onItemClick,
  onToggleComplete,
  getItemBadgeClass,
  getItemIcon,
  getTypeLabel,
}: {
  items: CalendarItem[];
  onItemClick: (item: CalendarItem) => void;
  onToggleComplete: (item: CalendarItem, e: React.MouseEvent) => void;
  getItemBadgeClass: (type: CalendarItem["type"]) => string;
  getItemIcon: (type: CalendarItem["type"]) => React.ReactNode;
  getTypeLabel: (type: CalendarItem["type"]) => string;
}) {
  // Group items by relative date (Overdue/Today, Upcoming, Completed)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = items.filter((i) => !i.isCompleted && new Date(i.date) >= today);
  const overdue = items.filter((i) => !i.isCompleted && new Date(i.date) < today);
  const completed = items.filter((i) => i.isCompleted);

  return (
    <div className="space-y-8">
      {/* Overdue Section */}
      {overdue.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" /> Overdue & Action Required ({overdue.length})
          </h4>
          <div className="relative border-l-2 border-rose-200 pl-4 space-y-3 ml-2">
            {overdue.map((item) => (
              <TimelineCard
                key={item.id}
                item={item}
                onItemClick={onItemClick}
                onToggleComplete={onToggleComplete}
                getItemBadgeClass={getItemBadgeClass}
                getItemIcon={getItemIcon}
                getTypeLabel={getTypeLabel}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
          <Clock className="h-4 w-4" /> Upcoming Schedule ({upcoming.length})
        </h4>
        {upcoming.length === 0 ? (
          <p className="text-xs text-slate-500 italic pl-2">No upcoming items scheduled.</p>
        ) : (
          <div className="relative border-l-2 border-blue-200 pl-4 space-y-3 ml-2">
            {upcoming.map((item) => (
              <TimelineCard
                key={item.id}
                item={item}
                onItemClick={onItemClick}
                onToggleComplete={onToggleComplete}
                getItemBadgeClass={getItemBadgeClass}
                getItemIcon={getItemIcon}
                getTypeLabel={getTypeLabel}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed Section */}
      {completed.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Completed Tasks & Revisions ({completed.length})
          </h4>
          <div className="relative border-l-2 border-emerald-200 pl-4 space-y-3 ml-2">
            {completed.map((item) => (
              <TimelineCard
                key={item.id}
                item={item}
                onItemClick={onItemClick}
                onToggleComplete={onToggleComplete}
                getItemBadgeClass={getItemBadgeClass}
                getItemIcon={getItemIcon}
                getTypeLabel={getTypeLabel}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineCard({
  item,
  onItemClick,
  onToggleComplete,
  getItemBadgeClass,
  getItemIcon,
  getTypeLabel,
}: {
  item: CalendarItem;
  onItemClick: (item: CalendarItem) => void;
  onToggleComplete: (item: CalendarItem, e: React.MouseEvent) => void;
  getItemBadgeClass: (type: CalendarItem["type"]) => string;
  getItemIcon: (type: CalendarItem["type"]) => React.ReactNode;
  getTypeLabel: (type: CalendarItem["type"]) => string;
}) {
  return (
    <div
      onClick={() => onItemClick(item)}
      className={`group flex items-start justify-between gap-3 rounded-2xl p-4 border bg-white shadow-xs cursor-pointer transition hover:border-blue-300 hover:shadow-md ${
        item.isCompleted ? "opacity-60 bg-slate-50/60" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={(e) => onToggleComplete(item, e)}
          className="mt-0.5 text-slate-400 hover:text-emerald-600 transition"
        >
          <CheckCircle2
            className={`h-5 w-5 ${
              item.isCompleted ? "fill-emerald-600 text-white" : ""
            }`}
          />
        </button>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${getItemBadgeClass(
                item.type
              )}`}
            >
              {getItemIcon(item.type)} {getTypeLabel(item.type)}
            </span>

            {item.meta?.subject && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {item.meta.subject}
              </span>
            )}
          </div>

          <h5
            className={`text-sm font-bold text-slate-900 group-hover:text-blue-600 transition ${
              item.isCompleted ? "line-through text-slate-500" : ""
            }`}
          >
            {item.title}
          </h5>

          {item.description && (
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>
      </div>

      <div className="text-right whitespace-nowrap">
        <p className="text-xs font-semibold text-slate-700">
          {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
        <p className="text-[11px] text-slate-400">
          {new Date(item.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
