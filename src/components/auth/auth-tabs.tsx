"use client";
export type AuthMode = "login" | "signup" | "reset";
export function AuthTabs({ mode, onChange }: { mode: AuthMode; onChange: (mode: AuthMode) => void }) {
  return <div className="grid grid-cols-3 border-b border-white/10" role="tablist" aria-label="Authentication options">{([{ id: "login", label: "Login" }, { id: "signup", label: "Sign Up" }, { id: "reset", label: "Forgot Password" }] as const).map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={mode === tab.id} onClick={() => onChange(tab.id)} className={`relative h-9 text-[10px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${mode === tab.id ? "text-violet-300" : "text-slate-500 hover:text-slate-300"}`}>{mode === tab.id && <span className="absolute inset-x-1 bottom-[-1px] h-px bg-violet-500 shadow-[0_0_8px_#8b5cf6]" />}{tab.label}</button>)}</div>;
}
