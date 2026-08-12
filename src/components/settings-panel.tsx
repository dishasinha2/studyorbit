"use client";

import { useEffect, useState } from "react";
import { Bell, Bot, Download, Eye, LogOut, Palette, ShieldCheck } from "lucide-react";
import { clearFirebaseSession, getFirebaseIdToken, readStoredSession } from "@/lib/firebase-client";

type Notify = { learningReminder: boolean; goalReminder: boolean; quietHoursStart: string | null; quietHoursEnd: string | null };

export function SettingsPanel() {
  const [notifications, setNotifications] = useState<Notify>({ learningReminder: true, goalReminder: true, quietHoursStart: null, quietHoursEnd: null });
  const [theme, setTheme] = useState("system");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [style, setStyle] = useState("balanced");
  const [recommendations, setRecommendations] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { void (async () => {
    const token = (await getFirebaseIdToken()) || readStoredSession()?.idToken;
    const res = await fetch("/api/notifications/preferences", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (res.ok) { const data = await res.json(); setNotifications((current) => ({ ...current, ...data.preferences })); }
    setTheme(localStorage.getItem("studyorbit.appearance") || "system");
    setReduceMotion(localStorage.getItem("studyorbit.reduce-motion") === "true");
    setStyle(localStorage.getItem("studyorbit.ai-style") || "balanced");
    setRecommendations(localStorage.getItem("studyorbit.ai-recommendations") !== "false");
  })(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const token = (await getFirebaseIdToken()) || readStoredSession()?.idToken;
      await fetch("/api/notifications/preferences", { method: "PATCH", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(notifications) });
      localStorage.setItem("studyorbit.appearance", theme); localStorage.setItem("studyorbit.reduce-motion", String(reduceMotion)); localStorage.setItem("studyorbit.ai-style", style); localStorage.setItem("studyorbit.ai-recommendations", String(recommendations));
      document.documentElement.dataset.theme = theme; document.documentElement.classList.toggle("reduce-motion", reduceMotion);
    } finally { setSaving(false); }
  };
  const exportData = async () => { const token = (await getFirebaseIdToken()) || readStoredSession()?.idToken; const res = await fetch("/api/profile/export", { headers: token ? { Authorization: `Bearer ${token}` } : {} }); if (!res.ok) return; const url = URL.createObjectURL(await res.blob()); const link = document.createElement("a"); link.href = url; link.download = "studyorbit-data.json"; link.click(); URL.revokeObjectURL(url); };
  const signOutEverywhere = async () => { await clearFirebaseSession(); window.location.assign("/"); };

  return <section className="settings-panel"><div className="settings-page-intro"><p className="settings-kicker">Workspace controls</p><h2>Settings</h2><p>Only the controls that matter for your day-to-day workspace.</p></div><div className="settings-controls">
    <article><span><Bell /></span><div><h3>Notifications</h3><p>Choose which reminders can reach you.</p><Toggle label="Enable notifications" checked={notifications.learningReminder} onChange={(value) => setNotifications({ ...notifications, learningReminder: value })} /><Toggle label="Goal reminders" checked={notifications.goalReminder} onChange={(value) => setNotifications({ ...notifications, goalReminder: value })} /><div className="settings-time"><label>Quiet hours <input type="time" value={notifications.quietHoursStart || ""} onChange={(e) => setNotifications({ ...notifications, quietHoursStart: e.target.value || null })} /></label><label>to <input type="time" value={notifications.quietHoursEnd || ""} onChange={(e) => setNotifications({ ...notifications, quietHoursEnd: e.target.value || null })} /></label></div></div></article>
    <article><span><Palette /></span><div><h3>Appearance</h3><p>Set the workspace look and motion.</p><div className="settings-options">{["light", "dark", "system"].map((item) => <button key={item} className={theme === item ? "is-selected" : ""} onClick={() => setTheme(item)}>{item}</button>)}</div><Toggle label="Reduce motion" checked={reduceMotion} onChange={setReduceMotion} /></div></article>
    <article><span><Bot /></span><div><h3>AI preferences</h3><p>Control how StudyOrbit responds and suggests.</p><div className="settings-options">{["concise", "balanced", "detailed"].map((item) => <button key={item} className={style === item ? "is-selected" : ""} onClick={() => setStyle(item)}>{item}</button>)}</div><Toggle label="AI recommendations" checked={recommendations} onChange={setRecommendations} /></div></article>
    <article><span><ShieldCheck /></span><div><h3>Privacy & security</h3><p>Manage your data and active access.</p><div className="settings-actions"><button onClick={() => void exportData()}><Download /> Export my data</button><button onClick={() => void signOutEverywhere()}><LogOut /> Sign out of all sessions</button><button className="danger" onClick={() => window.location.assign("/profile")}><Eye /> Delete account</button></div></div></article>
  </div><button className="settings-save" onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save settings"}</button></section>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="settings-toggle"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>; }
