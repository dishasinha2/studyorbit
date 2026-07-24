"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  BellRing,
  BookOpen,
  Calendar,
  Check,
  CheckCheck,
  Clock,
  Clock3,
  FileText,
  Filter,
  ListTodo,
  Plus,
  RotateCcw,
  Settings,
  Sparkles,
  Trash2,
  Volume2,
  Zap,
} from "lucide-react";
import { authHeaders, listenFcmMessages, requestFcmToken } from "@/lib/firebase-client";

type ReminderKind =
  | "task"
  | "deadline"
  | "reading"
  | "revision"
  | "ai_recommendation"
  | "daily_productivity"
  | "learning"
  | "goal"
  | "resume"
  | "certification"
  | "interview";

type Reminder = {
  id: string;
  title: string;
  kind: string;
  message: string | null;
  dueAt: string;
  channels: string[];
  isSent: boolean;
  createdAt: string;
  metadata?: {
    isRead?: boolean;
    source?: string;
  } | null;
};

type NotificationPreferences = {
  channels: string[];
  learningReminder: boolean;
  resumeUpdateReminder: boolean;
  certificationReminder: boolean;
  interviewReminder: boolean;
  goalReminder: boolean;
  taskReminder?: boolean;
  deadlineReminder?: boolean;
  readingReminder?: boolean;
  revisionReminder?: boolean;
  aiRecommendationReminder?: boolean;
  dailyProductivityReminder?: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  timezone: string;
};

const KIND_METADATA: Record<
  string,
  { label: string; icon: typeof Bell; color: string; badgeBg: string }
> = {
  task: { label: "Task", icon: ListTodo, color: "text-amber-500", badgeBg: "bg-amber-50 text-amber-700 border-amber-200" },
  deadline: { label: "Deadline", icon: Calendar, color: "text-rose-500", badgeBg: "bg-rose-50 text-rose-700 border-rose-200" },
  reading: { label: "Reading", icon: BookOpen, color: "text-blue-500", badgeBg: "bg-blue-50 text-blue-700 border-blue-200" },
  revision: { label: "Revision", icon: RotateCcw, color: "text-purple-500", badgeBg: "bg-purple-50 text-purple-700 border-purple-200" },
  ai_recommendation: { label: "AI Insight", icon: Sparkles, color: "text-cyan-500", badgeBg: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  daily_productivity: { label: "Productivity", icon: Zap, color: "text-emerald-500", badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  learning: { label: "Learning", icon: BookOpen, color: "text-indigo-500", badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  goal: { label: "Goal", icon: CheckCheck, color: "text-teal-500", badgeBg: "bg-teal-50 text-teal-700 border-teal-200" },
  resume: { label: "Resume", icon: FileText, color: "text-slate-500", badgeBg: "bg-slate-100 text-slate-700 border-slate-200" },
  certification: { label: "Certification", icon: Check, color: "text-orange-500", badgeBg: "bg-orange-50 text-orange-700 border-orange-200" },
  interview: { label: "Interview", icon: Volume2, color: "text-violet-500", badgeBg: "bg-violet-50 text-violet-700 border-violet-200" },
};

export function NotificationCenterPanel() {
  const [activeTab, setActiveTab] = useState<"inbox" | "history" | "preferences" | "create">("inbox");
  const [filterKind, setFilterKind] = useState<string>("all");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fcmStatus, setFcmStatus] = useState<{ enabled: boolean; token: string | null; message: string }>({
    enabled: false,
    token: null,
    message: "Checking push status...",
  });

  // Custom reminder creation state
  const [newTitle, setNewTitle] = useState("");
  const [newKind, setNewKind] = useState<ReminderKind>("task");
  const [newMessage, setNewMessage] = useState("");
  const [newDueAt, setNewDueAt] = useState("");
  const [newChannels, setNewChannels] = useState<string[]>(["WEB_PUSH", "EMAIL"]);

  // Preference state
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    channels: ["EMAIL", "WEB_PUSH"],
    learningReminder: true,
    resumeUpdateReminder: true,
    certificationReminder: true,
    interviewReminder: true,
    goalReminder: true,
    taskReminder: true,
    deadlineReminder: true,
    readingReminder: true,
    revisionReminder: true,
    aiRecommendationReminder: true,
    dailyProductivityReminder: true,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
    timezone: "UTC",
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadReminders = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await authHeaders();
      if (!headers.Authorization) return;

      const res = await fetch("/api/notifications/reminders?includeSent=true", { headers });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.reminders) {
        setReminders(json.reminders);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPreferences = useCallback(async () => {
    const headers = await authHeaders();
    if (!headers.Authorization) return;

    const res = await fetch("/api/notifications/preferences", { headers });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.preferences) {
      setPrefs((prev) => ({
        ...prev,
        ...json.preferences,
      }));
    }
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void loadReminders();
      void loadPreferences();

      // Check FCM browser state
      if (typeof window !== "undefined" && "Notification" in window) {
        const perm = Notification.permission;
        const savedToken = localStorage.getItem("studyorbit.fcm_token");
        setFcmStatus({
          enabled: perm === "granted",
          token: savedToken,
          message: perm === "granted" ? "Push notifications active" : "Push notifications disabled",
        });
      } else {
        setFcmStatus({ enabled: false, token: null, message: "Push not supported in browser" });
      }
    });

    // Listen to real-time incoming FCM push messages
    let unsubscribe: () => void;
    void listenFcmMessages(() => {
      showToast("New live notification received!");
      void loadReminders();
    }).then((unsub) => {
      if (unsub) unsubscribe = unsub;
    });

    return () => {
      cancelAnimationFrame(id);
      if (unsubscribe) unsubscribe();
    };
  }, [loadReminders, loadPreferences]);

  async function handleEnableFcm() {
    setFcmStatus((prev) => ({ ...prev, message: "Requesting FCM push permission..." }));
    const result = await requestFcmToken();
    if (result.token) {
      setFcmStatus({
        enabled: true,
        token: result.token,
        message: "Firebase Cloud Messaging connected!",
      });
      showToast("FCM push notifications enabled!");
      // Save FCM token to preferences
      const headers = await authHeaders();
      if (headers.Authorization) {
        void fetch("/api/notifications/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({ fcmToken: result.token }),
        });
      }
    } else {
      setFcmStatus({
        enabled: false,
        token: null,
        message: result.error || "Permission denied",
      });
      showToast(result.error || "Failed to enable FCM");
    }
  }

  async function handleGenerateSmartReminders() {
    setLoading(true);
    const headers = await authHeaders();
    if (!headers.Authorization) return;

    try {
      const res = await fetch("/api/notifications/reminders/generate", {
        method: "POST",
        headers,
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        showToast(`Generated ${json.createdCount || 6} smart career reminders!`);
        await loadReminders();
      } else {
        showToast("Unable to generate reminders.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(id: string) {
    const headers = await authHeaders();
    if (!headers.Authorization) return;

    // Optimistic UI update
    setReminders((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, metadata: { ...r.metadata, isRead: true } } : r
      )
    );

    await fetch(`/api/notifications/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ isRead: true }),
    });
  }

  async function handleMarkAllRead() {
    const headers = await authHeaders();
    if (!headers.Authorization) return;

    setReminders((prev) =>
      prev.map((r) => ({ ...r, metadata: { ...r.metadata, isRead: true } }))
    );

    await fetch("/api/notifications/reminders/read-all", {
      method: "PATCH",
      headers,
    });
    showToast("All notifications marked as read.");
  }

  async function handleDelete(id: string) {
    const headers = await authHeaders();
    if (!headers.Authorization) return;

    setReminders((prev) => prev.filter((r) => r.id !== id));

    await fetch(`/api/notifications/reminders/${id}`, {
      method: "DELETE",
      headers,
    });
    showToast("Notification deleted.");
  }

  async function handleClearHistory() {
    const headers = await authHeaders();
    if (!headers.Authorization) return;

    setReminders((prev) =>
      prev.filter((r) => !Boolean(r.metadata?.isRead))
    );

    await fetch("/api/notifications/reminders/clear-read", {
      method: "DELETE",
      headers,
    });
    showToast("Read notification history cleared.");
  }

  async function handleCreateReminder() {
    if (!newTitle.trim()) return;
    const headers = await authHeaders();
    if (!headers.Authorization) return;

    const res = await fetch("/api/notifications/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({
        title: newTitle.trim(),
        kind: newKind,
        message: newMessage.trim() || null,
        dueAt: newDueAt ? new Date(newDueAt).toISOString() : new Date().toISOString(),
        channels: newChannels,
      }),
    });

    if (res.ok) {
      showToast("Reminder created!");
      setNewTitle("");
      setNewMessage("");
      setNewDueAt("");
      setActiveTab("inbox");
      await loadReminders();
    } else {
      showToast("Error creating reminder.");
    }
  }

  async function handleSavePreferences() {
    const headers = await authHeaders();
    if (!headers.Authorization) return;

    const res = await fetch("/api/notifications/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(prefs),
    });

    if (res.ok) {
      showToast("Preferences saved!");
    } else {
      showToast("Failed to save preferences.");
    }
  }

  // Filter calculations
  const filteredReminders = reminders.filter((r) => {
    if (filterKind !== "all" && r.kind !== filterKind) return false;
    const isRead = Boolean(r.metadata?.isRead);
    if (activeTab === "inbox") return !isRead;
    if (activeTab === "history") return isRead;
    return true;
  });

  const unreadCount = reminders.filter((r) => !Boolean(r.metadata?.isRead)).length;
  const historyCount = reminders.filter((r) => Boolean(r.metadata?.isRead)).length;

  return (
    <section className="panel shell-frame p-6 relative">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl animate-fade-in border border-slate-700">
          <BellRing className="h-4 w-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-600">
              Notification Center
            </p>
            {unreadCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-cyan-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                {unreadCount} new
              </span>
            )}
          </div>
          <h2 className="mt-1 text-2xl font-black text-slate-800 tracking-tight">
            Reminders, Deadlines & AI Insights
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleEnableFcm}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
              fcmStatus.enabled
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Bell className={`h-4 w-4 ${fcmStatus.enabled ? "text-emerald-600" : "text-slate-400"}`} />
            <span>{fcmStatus.enabled ? "FCM Push Enabled" : "Enable Push Alerts"}</span>
          </button>

          <button
            type="button"
            onClick={handleGenerateSmartReminders}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:from-blue-700 hover:to-cyan-700 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            <span>Auto-Generate Reminders</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <nav className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("inbox")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition-all ${
              activeTab === "inbox"
                ? "bg-blue-600 font-bold text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Bell className="h-3.5 w-3.5" />
            <span>Inbox</span>
            {unreadCount > 0 && (
              <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${activeTab === "inbox" ? "bg-white text-blue-600" : "bg-slate-200 text-slate-700"}`}>
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition-all ${
              activeTab === "history"
                ? "bg-blue-600 font-bold text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Clock3 className="h-3.5 w-3.5" />
            <span>History</span>
            {historyCount > 0 && (
              <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${activeTab === "history" ? "bg-white text-blue-600" : "bg-slate-200 text-slate-700"}`}>
                {historyCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("preferences")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition-all ${
              activeTab === "preferences"
                ? "bg-blue-600 font-bold text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Preferences</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 transition-all ${
              activeTab === "create"
                ? "bg-blue-600 font-bold text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Custom</span>
          </button>
        </nav>

        {(activeTab === "inbox" || activeTab === "history") && (
          <div className="flex items-center gap-2">
            {activeTab === "inbox" && unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            )}

            {activeTab === "history" && historyCount > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear history</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Category Filter Pills (For Inbox & History tabs) */}
      {(activeTab === "inbox" || activeTab === "history") && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            <Filter className="h-3 w-3" /> Filter:
          </span>
          {[
            { id: "all", label: "All Types" },
            { id: "task", label: "Tasks" },
            { id: "deadline", label: "Deadlines" },
            { id: "reading", label: "Reading" },
            { id: "revision", label: "Revision" },
            { id: "ai_recommendation", label: "AI Insights" },
            { id: "daily_productivity", label: "Productivity" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilterKind(cat.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                filterKind === cat.id
                  ? "bg-slate-800 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content 1: Inbox or History */}
      {(activeTab === "inbox" || activeTab === "history") && (
        <div className="mt-4 grid gap-3">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">
              <Clock className="h-6 w-6 animate-spin mx-auto mb-2 text-cyan-500" />
              Loading notifications...
            </div>
          ) : filteredReminders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
              <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                {activeTab === "inbox" ? "Your inbox is clear!" : "No notification history found."}
              </p>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                {activeTab === "inbox"
                  ? "Click 'Auto-Generate Reminders' above to scan your tasks, deadlines, readings, and AI insights."
                  : "Completed or read notifications will appear here in your history log."}
              </p>
            </div>
          ) : (
            filteredReminders.map((item) => {
              const meta = KIND_METADATA[item.kind] || KIND_METADATA.task;
              const IconComp = meta.icon;
              const isRead = Boolean(item.metadata?.isRead);

              return (
                <div
                  key={item.id}
                  className={`group flex flex-wrap items-start justify-between gap-3 rounded-2xl border p-4 transition-all ${
                    isRead
                      ? "border-slate-200/80 bg-slate-50/50 opacity-80"
                      : "border-blue-200/90 bg-white shadow-sm hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-start gap-3 max-w-2xl">
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${meta.badgeBg}`}>
                      <IconComp className="h-4 w-4" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.badgeBg}`}>
                          {meta.label}
                        </span>

                        <span className="text-[11px] font-medium text-slate-400">
                          {new Date(item.dueAt || item.createdAt).toLocaleString()}
                        </span>

                        {!isRead && (
                          <span className="h-2 w-2 rounded-full bg-cyan-500" title="Unread" />
                        )}
                      </div>

                      <h4 className={`mt-1 text-sm font-bold ${isRead ? "text-slate-700" : "text-slate-900"}`}>
                        {item.title}
                      </h4>

                      {item.message && (
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                          {item.message}
                        </p>
                      )}

                      <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                        <span>Channels: {item.channels.join(", ")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 opacity-90 group-hover:opacity-100">
                    {!isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(item.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Read</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                      title="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab Content 2: Custom Reminder Creation */}
      {activeTab === "create" && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
          <h3 className="text-sm font-bold text-slate-800">Create Custom Reminder</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Schedule a targeted reminder for tasks, deadlines, reading, or revision.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Reminder Title</label>
              <input
                type="text"
                className="input mt-1"
                placeholder="e.g. Complete System Architecture Chapter"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Category / Kind</label>
              <select
                className="input mt-1"
                value={newKind}
                onChange={(e) => setNewKind(e.target.value as ReminderKind)}
              >
                <option value="task">Task Reminder</option>
                <option value="deadline">Deadline Alert</option>
                <option value="reading">Reading Material</option>
                <option value="revision">Revision Note</option>
                <option value="ai_recommendation">AI Recommendation</option>
                <option value="daily_productivity">Daily Productivity</option>
                <option value="learning">Learning Module</option>
                <option value="goal">Goal Progress</option>
                <option value="resume">Resume Update</option>
                <option value="certification">Certification</option>
                <option value="interview">Interview Prep</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">Description / Note</label>
              <textarea
                className="input mt-1 h-20 resize-none"
                placeholder="Optional detailed instructions or context..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Due Date & Time</label>
              <input
                type="datetime-local"
                className="input mt-1"
                value={newDueAt}
                onChange={(e) => setNewDueAt(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Notification Channels</label>
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                {["WEB_PUSH", "EMAIL", "MOBILE_PUSH"].map((ch) => (
                  <label key={ch} className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newChannels.includes(ch)}
                      onChange={(e) => {
                        if (e.target.checked) setNewChannels([...newChannels, ch]);
                        else setNewChannels(newChannels.filter((c) => c !== ch));
                      }}
                      className="rounded text-blue-600"
                    />
                    <span className="font-medium text-slate-700">{ch.replace("_", " ")}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("inbox")}
              className="btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!newTitle.trim()}
              onClick={handleCreateReminder}
              className="btn-primary text-xs px-5 py-2 inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Save Reminder
            </button>
          </div>
        </div>
      )}

      {/* Tab Content 3: Preferences */}
      {activeTab === "preferences" && (
        <div className="mt-5 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Bell className="h-4 w-4 text-cyan-600" />
              Notification Category Subscriptions
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Select which types of notifications and reminders you wish to receive.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { key: "taskReminder", label: "Task Reminders", desc: "Pending tasks & study to-dos" },
                { key: "deadlineReminder", label: "Deadline Alerts", desc: "Calendar events & due dates" },
                { key: "readingReminder", label: "Reading Reminders", desc: "Uploaded files & documents" },
                { key: "revisionReminder", label: "Revision Prompts", desc: "Sticky notes & study review" },
                { key: "aiRecommendationReminder", label: "AI Recommendations", desc: "Career readiness tips & skill gaps" },
                { key: "dailyProductivityReminder", label: "Daily Productivity", desc: "Streak check-ins & Pomodoro goals" },
                { key: "learningReminder", label: "Learning Modules", desc: "Roadmap progression alerts" },
                { key: "goalReminder", label: "Goal Updates", desc: "Career milestone progress" },
                { key: "resumeUpdateReminder", label: "Resume & Portfolio", desc: "Resume review suggestions" },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 hover:bg-slate-100/80 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(prefs[item.key as keyof NotificationPreferences])}
                    onChange={(e) =>
                      setPrefs({ ...prefs, [item.key]: e.target.checked })
                    }
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-800">{item.label}</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">{item.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Settings className="h-4 w-4 text-cyan-600" />
              Delivery Channels & Quiet Hours
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Channels Enabled</label>
                <div className="mt-2 flex flex-wrap gap-4 text-xs">
                  {["WEB_PUSH", "EMAIL", "MOBILE_PUSH"].map((ch) => (
                    <label key={ch} className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prefs.channels.includes(ch)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...prefs.channels, ch]
                            : prefs.channels.filter((c) => c !== ch);
                          setPrefs({ ...prefs, channels: updated });
                        }}
                        className="rounded text-blue-600"
                      />
                      <span className="font-semibold text-slate-700">{ch.replace("_", " ")}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Timezone</label>
                <select
                  className="input mt-1"
                  value={prefs.timezone}
                  onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })}
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Quiet Hours Start</label>
                <input
                  type="time"
                  className="input mt-1"
                  value={prefs.quietHoursStart || ""}
                  onChange={(e) => setPrefs({ ...prefs, quietHoursStart: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Quiet Hours End</label>
                <input
                  type="time"
                  className="input mt-1"
                  value={prefs.quietHoursEnd || ""}
                  onChange={(e) => setPrefs({ ...prefs, quietHoursEnd: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleSavePreferences}
                className="btn-primary text-xs px-5 py-2 inline-flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
