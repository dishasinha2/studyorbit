"use client";

import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CalendarDays,
  CheckCircle2,
  Crop,
  Download,
  FileStack,
  Flame,
  Link2,
  PenSquare,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  UserCircle2,
  X,
  Youtube,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import type { UserProfileSummary } from "@/lib/types";

type UserProfilePanelProps = {
  compact?: boolean;
};

function initialsFromProfile(profile: UserProfileSummary | null) {
  const source = profile?.name || profile?.email || "Study Orbit";
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function activityLabel(kind: NonNullable<UserProfileSummary["recentActivity"]>[number]["kind"]) {
  switch (kind) {
    case "task":
      return "Task";
    case "note":
      return "Note";
    case "link":
      return "Link";
    case "file":
      return "File";
    case "video":
      return "Video";
    case "sticky":
      return "Sticky";
    case "focus":
      return "Focus";
  }
}

function formatDateLabel(value: string) {
  return new Date(value).toLocaleDateString();
}

export function UserProfilePanel({ compact = false }: UserProfilePanelProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [profile, setProfile] = useState<UserProfileSummary | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [avatarDraft, setAvatarDraft] = useState<string | null>(null);
  const [themePreference, setThemePreference] = useState<"pastel" | "light">("pastel");
  const [studyGoalMin, setStudyGoalMin] = useState(120);
  const [focusSessionMin, setFocusSessionMin] = useState(25);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [cropScale, setCropScale] = useState(1);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState<null | "reset_profile" | "clear_workspace">(null);
  const [confirmAction, setConfirmAction] = useState<null | "reset_profile" | "clear_workspace">(null);
  const [message, setMessage] = useState("");
  const cropImageRef = useRef<HTMLImageElement | null>(null);

  const loadProfile = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(json?.error ?? "Unable to load profile.");
        setLoading(false);
        return;
      }

      setProfile(json.profile);
      setNameInput(json.profile.name ?? "");
      setAvatarDraft(json.profile.avatarUrl ?? null);
      setThemePreference((json.profile.preferences?.themePreference as "pastel" | "light") ?? "pastel");
      setStudyGoalMin(json.profile.preferences?.studyGoalMin ?? 120);
      setFocusSessionMin(json.profile.preferences?.focusSessionMin ?? 25);
      setMessage("");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const chartData = useMemo(() => {
    if (!profile) return [];
    return [
      { label: "Tasks", value: profile.stats.tasks, tint: "from-indigo-200 to-indigo-400" },
      { label: "Notes", value: profile.stats.notes, tint: "from-fuchsia-200 to-fuchsia-400" },
      { label: "Links", value: profile.stats.links, tint: "from-sky-200 to-sky-400" },
      { label: "Files", value: profile.stats.files, tint: "from-cyan-200 to-cyan-400" },
      { label: "Videos", value: profile.stats.videos, tint: "from-pink-200 to-pink-400" },
      { label: "Focus", value: profile.stats.focusSessions, tint: "from-emerald-200 to-emerald-400" },
    ];
  }, [profile]);

  const maxChartValue = useMemo(() => Math.max(1, ...chartData.map((item) => item.value)), [chartData]);
  const completionRate = profile?.stats.tasks ? Math.round((profile.stats.completedTasks / profile.stats.tasks) * 100) : 0;

  async function authToken() {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function saveProfile() {
    if (!supabase) return;

    setSaving(true);
    try {
      const token = await authToken();
      if (!token) return;

      const body: {
        name?: string;
        avatarUrl?: string | null;
        themePreference?: "pastel" | "light";
        studyGoalMin?: number;
        focusSessionMin?: number;
      } = {};
      body.themePreference = themePreference;
      body.studyGoalMin = studyGoalMin;
      body.focusSessionMin = focusSessionMin;
      if (nameInput.trim()) body.name = nameInput.trim();
      if (avatarDraft !== undefined) body.avatarUrl = avatarDraft;

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(json?.error ?? "Unable to save profile.");
        return;
      }

      setProfile((current) =>
        current ? { ...current, name: json.profile.name, avatarUrl: json.profile.avatarUrl } : current,
      );
      setMessage("Profile updated.");
    } finally {
      setSaving(false);
    }
  }

  function handleAvatarFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      setCropSource(result);
      setCropScale(1);
      setCropX(0);
      setCropY(0);
      setMessage("");
    };
    reader.readAsDataURL(file);
  }

  function applyAvatarCrop() {
    const image = cropImageRef.current;
    if (!image) return;

    const canvas = document.createElement("canvas");
    const size = 320;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawWidth = image.naturalWidth * cropScale;
    const drawHeight = image.naturalHeight * cropScale;
    const x = (size - drawWidth) / 2 + cropX;
    const y = (size - drawHeight) / 2 + cropY;

    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(image, x, y, drawWidth, drawHeight);

    setAvatarDraft(canvas.toDataURL("image/png"));
    setCropSource(null);
    setMessage("Avatar cropped. Save profile to apply it.");
  }

  async function exportData() {
    if (!supabase) return;

    setExporting(true);
    try {
      const token = await authToken();
      if (!token) return;

      const res = await fetch("/api/profile/export", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setMessage("Unable to export data.");
        return;
      }

      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = "studyorbit-profile-export.json";
      link.click();
      URL.revokeObjectURL(href);
      setMessage("Export downloaded.");
    } finally {
      setExporting(false);
    }
  }

  async function runProfileDelete(action: "reset_profile" | "clear_workspace") {
    if (!supabase) return;
    setClearing(action);
    try {
      const token = await authToken();
      if (!token) return;

      const res = await fetch("/api/profile", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(json?.error ?? "Unable to update account data.");
        return;
      }

      if (action === "reset_profile") {
        setNameInput("");
        setAvatarDraft(null);
        setThemePreference("pastel");
        setStudyGoalMin(120);
        setFocusSessionMin(25);
        setProfile((current) =>
          current
            ? {
                ...current,
                name: null,
                avatarUrl: null,
                preferences: { themePreference: "pastel", studyGoalMin: 120, focusSessionMin: 25 },
              }
            : current,
        );
        setMessage("Profile appearance reset.");
      } else {
        await loadProfile();
        setMessage("Workspace data cleared.");
      }
    } finally {
      setClearing(null);
    }
  }

  if (loading) {
    return (
      <div className={compact ? "sidebar-profile w-full" : "panel shell-frame p-5"}>
        <div className="module-skeleton-card w-full">
          <div className="module-skeleton-line module-skeleton-line-lg" />
          <div className="module-skeleton-line module-skeleton-line-md" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return compact ? null : <div className="panel p-5 text-sm text-slate-400">Profile data is available after login.</div>;
  }

  const displayName = profile.name?.trim() || "StudyOrbit User";
  const avatarSource = avatarDraft || profile.avatarUrl || null;
  const maxFocusTrend = Math.max(1, ...(profile.focusTrend?.map((item) => item.minutes) ?? [0]));

  if (compact) {
    return (
      <div className="sidebar-profile w-full">
        {avatarSource ? (
          <img src={avatarSource} alt={displayName} className="sidebar-profile-avatar object-cover" />
        ) : (
          <div className="sidebar-profile-avatar">{initialsFromProfile(profile) || "SO"}</div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-100">{displayName}</p>
          <p className="truncate text-xs text-slate-400">{profile.email ?? "Authenticated account"}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {profile.stats.tasks} tasks · {profile.stats.notes} notes · {profile.stats.files} files
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="panel shell-frame p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {avatarSource ? (
              <img src={avatarSource} alt={displayName} className="profile-avatar-lg object-cover" />
            ) : (
              <div className="profile-avatar-lg">{initialsFromProfile(profile) || "SO"}</div>
            )}
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-500">User Profile</p>
              <h2 className="mt-2 text-2xl font-black text-slate-700">{displayName}</h2>
              <p className="text-sm text-slate-500">{profile.email ?? "Authenticated account"}</p>
              <p className="mt-1 text-xs text-slate-400">Joined {formatDateLabel(profile.createdAt)}</p>
            </div>
          </div>
          <div className="grid min-w-[280px] gap-2">
            <input className="input" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Update display name" />
            <label className="btn-secondary inline-flex cursor-pointer items-center justify-center gap-2 px-4 py-2 text-sm">
              <Upload className="h-4 w-4" /> Upload avatar
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
            </label>
            <div className="flex gap-2">
              <button className="btn-secondary inline-flex flex-1 items-center justify-center gap-2 px-4 py-2 text-sm" onClick={saveProfile} disabled={saving}>
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save profile"}
              </button>
              <button className="btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm" onClick={exportData} disabled={exporting}>
                <Download className="h-4 w-4" /> {exporting ? "..." : "Export"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="soft-card p-4">
            <p className="sub-title">Theme</p>
            <div className="mt-3 flex gap-2">
              {(["pastel", "light"] as const).map((option) => (
                <button
                  key={option}
                  className={`chip ${themePreference === option ? "chip-active" : ""}`}
                  onClick={() => setThemePreference(option)}
                >
                  {option === "pastel" ? "Pastel" : "Light"}
                </button>
              ))}
            </div>
          </div>
          <div className="soft-card p-4">
            <p className="sub-title">Daily goal</p>
            <div className="mt-3 flex items-center gap-3">
              <input
                className="input"
                type="number"
                min={30}
                max={600}
                value={studyGoalMin}
                onChange={(e) => setStudyGoalMin(Number(e.target.value) || 120)}
              />
              <span className="text-sm text-slate-500">min</span>
            </div>
          </div>
          <div className="soft-card p-4">
            <p className="sub-title">Focus block</p>
            <div className="mt-3 flex items-center gap-3">
              <input
                className="input"
                type="number"
                min={10}
                max={90}
                value={focusSessionMin}
                onChange={(e) => setFocusSessionMin(Number(e.target.value) || 25)}
              />
              <span className="text-sm text-slate-500">min</span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="soft-card p-4">
            <p className="sub-title">
              <UserCircle2 className="h-3.5 w-3.5" /> Study activity
            </p>
            <p className="mt-2 text-2xl font-black text-slate-700">{profile.stats.tasks}</p>
            <p className="text-xs text-slate-500">Tasks tracked · {profile.stats.completedTasks} completed</p>
          </div>
          <div className="soft-card p-4">
            <p className="sub-title">
              <PenSquare className="h-3.5 w-3.5" /> Notes + links
            </p>
            <p className="mt-2 text-2xl font-black text-slate-700">{profile.stats.notes + profile.stats.links}</p>
            <p className="text-xs text-slate-500">{profile.stats.notes} notes · {profile.stats.links} saved links</p>
          </div>
          <div className="soft-card p-4">
            <p className="sub-title">
              <FileStack className="h-3.5 w-3.5" /> Resources
            </p>
            <p className="mt-2 text-2xl font-black text-slate-700">{profile.stats.files + profile.stats.videos}</p>
            <p className="text-xs text-slate-500">{profile.stats.files} files · {profile.stats.videos} videos</p>
          </div>
          <div className="soft-card p-4">
            <p className="sub-title">
              <Flame className="h-3.5 w-3.5" /> Focus history
            </p>
            <p className="mt-2 text-2xl font-black text-slate-700">{profile.stats.focusMinutes}</p>
            <p className="text-xs text-slate-500">{profile.stats.focusSessions} sessions · total focus minutes</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="soft-card p-5">
            <p className="sub-title">Study distribution</p>
            <div className="mt-4 space-y-3">
              {chartData.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                    <span>{item.label}</span>
                    <span className="font-semibold text-slate-700">{item.value}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/70">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${item.tint} transition-[width] duration-700`}
                      style={{ width: `${(item.value / maxChartValue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="soft-card p-5">
            <p className="sub-title">Completion snapshot</p>
            <div className="mt-4 flex items-center gap-5">
              <div
                className="grid h-24 w-24 place-items-center rounded-full border border-indigo-200/80 bg-white/70 text-center shadow-sm"
                style={{
                  backgroundImage: `conic-gradient(rgba(135,121,245,0.86) ${completionRate * 3.6}deg, rgba(255,255,255,0.6) 0deg)`,
                }}
              >
                <div className="grid h-16 w-16 place-items-center rounded-full bg-[rgba(255,250,253,0.95)] text-sm font-bold text-slate-700">
                  {completionRate}%
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-700">{profile.stats.completedTasks}</span> tasks completed
                </p>
                <p>
                  <span className="font-semibold text-slate-700">{profile.stats.tasks - profile.stats.completedTasks}</span> still open
                </p>
                <p>
                  <span className="font-semibold text-slate-700">{profile.stats.focusMinutes}</span> total focus minutes
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 soft-card p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="sub-title">Recent focus trend</p>
            <span className="text-xs text-slate-500">Last 7 days</span>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-3">
            {profile.focusTrend?.map((item) => (
              <div key={item.day} className="flex flex-col items-center gap-2">
                <div className="flex h-28 w-full items-end rounded-2xl bg-white/60 p-2 shadow-inner">
                  <div
                    className="w-full rounded-xl bg-gradient-to-t from-indigo-300 via-fuchsia-200 to-sky-200 transition-[height] duration-700"
                    style={{ height: `${Math.max(10, (item.minutes / maxFocusTrend) * 100)}%` }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-700">{item.minutes}m</p>
                  <p className="text-[11px] text-slate-500">{new Date(item.day).toLocaleDateString(undefined, { weekday: "short" })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="timeline-card">
            <p className="sub-title">
              <CalendarDays className="h-3.5 w-3.5" /> Tasks
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {profile.stats.completedTasks}/{profile.stats.tasks} completed
            </p>
          </div>
          <div className="timeline-card">
            <p className="sub-title">
              <Youtube className="h-3.5 w-3.5" /> Resources
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {profile.stats.videos} videos · {profile.stats.files} files
            </p>
          </div>
          <div className="timeline-card">
            <p className="sub-title">
              <Link2 className="h-3.5 w-3.5" /> Workspace footprint
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {profile.stats.projects} projects · {profile.stats.stickies} sticky notes
            </p>
          </div>
        </div>

        <div className="mt-5">
          <p className="sub-title">Recent activity</p>
          <div className="mt-3 grid gap-3">
            {profile.recentActivity?.length ? (
              profile.recentActivity.map((item) => (
                <div key={`${item.kind}-${item.id}`} className="timeline-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {activityLabel(item.kind)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                    </div>
                    <span className="text-xs text-slate-400">{formatDateLabel(item.at)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="timeline-card text-sm text-slate-500">Activity appears here as you use the workspace.</div>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <div className="soft-card p-5">
            <p className="sub-title">Profile controls</p>
            <p className="mt-2 text-sm text-slate-500">Reset display name and avatar without touching your saved study data.</p>
            <button
              className="btn-secondary mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm"
              onClick={() => setConfirmAction("reset_profile")}
              disabled={clearing !== null}
            >
              <RotateCcw className="h-4 w-4" />
              {clearing === "reset_profile" ? "Resetting..." : "Reset profile appearance"}
            </button>
          </div>

          <div className="soft-card p-5 border-rose-200/70">
            <p className="sub-title text-rose-500">
              <Trash2 className="h-3.5 w-3.5" /> Data controls
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Clear app data from StudyOrbit while keeping your login account active.
            </p>
            <button
              className="btn-secondary mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm text-rose-600"
              onClick={() => setConfirmAction("clear_workspace")}
              disabled={clearing !== null}
            >
              <Trash2 className="h-4 w-4" />
              {clearing === "clear_workspace" ? "Clearing..." : "Clear workspace data"}
            </button>
          </div>
        </div>

        {message ? <p className="mt-4 text-xs text-cyan-600">{message}</p> : null}
      </section>

      {cropSource ? (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/40 px-4 backdrop-blur-md">
          <div className="panel shell-frame w-full max-w-2xl p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-500">Avatar Crop</p>
                <h3 className="mt-2 text-xl font-black text-slate-700">Adjust before saving.</h3>
              </div>
              <button className="btn-secondary px-3 py-2 text-sm" onClick={() => setCropSource(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="soft-card p-4">
                <p className="sub-title">
                  <Crop className="h-3.5 w-3.5" /> Preview
                </p>
                <div className="mt-4 grid place-items-center">
                  <div className="relative h-56 w-56 overflow-hidden rounded-[1.5rem] border border-indigo-100 bg-white/70 shadow-inner">
                    <img
                      ref={cropImageRef}
                      src={cropSource}
                      alt="Crop preview"
                      className="absolute left-1/2 top-1/2 max-w-none"
                      style={{
                        width: `${cropScale * 100}%`,
                        transform: `translate(calc(-50% + ${cropX}px), calc(-50% + ${cropY}px))`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="soft-card p-4">
                <p className="sub-title">Crop controls</p>
                <div className="mt-4 space-y-4">
                  <label className="block text-sm text-slate-600">
                    Zoom
                    <input
                      className="mt-2 w-full"
                      type="range"
                      min="0.8"
                      max="2.2"
                      step="0.01"
                      value={cropScale}
                      onChange={(e) => setCropScale(Number(e.target.value))}
                    />
                  </label>
                  <label className="block text-sm text-slate-600">
                    Horizontal
                    <input
                      className="mt-2 w-full"
                      type="range"
                      min="-140"
                      max="140"
                      step="1"
                      value={cropX}
                      onChange={(e) => setCropX(Number(e.target.value))}
                    />
                  </label>
                  <label className="block text-sm text-slate-600">
                    Vertical
                    <input
                      className="mt-2 w-full"
                      type="range"
                      min="-140"
                      max="140"
                      step="1"
                      value={cropY}
                      onChange={(e) => setCropY(Number(e.target.value))}
                    />
                  </label>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button className="btn-primary px-4 py-2 text-sm" onClick={applyAvatarCrop}>
                    Use cropped avatar
                  </button>
                  <button
                    className="btn-secondary px-4 py-2 text-sm"
                    onClick={() => {
                      setCropScale(1);
                      setCropX(0);
                      setCropY(0);
                    }}
                  >
                    Reset crop
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {confirmAction ? (
        <div className="fixed inset-0 z-[130] grid place-items-center bg-slate-950/40 px-4 backdrop-blur-md">
          <div className="panel shell-frame w-full max-w-lg p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-rose-500">Confirm Action</p>
                <h3 className="mt-2 text-xl font-black text-slate-700">
                  {confirmAction === "clear_workspace" ? "Clear workspace data?" : "Reset profile appearance?"}
                </h3>
              </div>
              <button className="btn-secondary px-3 py-2 text-sm" onClick={() => setConfirmAction(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              {confirmAction === "clear_workspace"
                ? "This removes tasks, notes, files, videos, links, stickies, boards, focus sessions, and projects from StudyOrbit."
                : "This clears your display name, avatar, and profile preferences and restores defaults."}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button className="btn-secondary px-4 py-2 text-sm" onClick={() => setConfirmAction(null)}>
                Cancel
              </button>
              <button
                className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm text-rose-600"
                onClick={() => {
                  void runProfileDelete(confirmAction);
                  setConfirmAction(null);
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
