"use client";

import { useMemo, useState } from "react";
import { LogOut, Mail } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

type AuthPanelProps = {
  ready: boolean;
  loggedIn: boolean;
  email?: string;
  demoMode: boolean;
  onRefresh: () => Promise<void>;
};

export function AuthPanel({ ready, loggedIn, email, demoMode, onRefresh }: AuthPanelProps) {
  const [emailInput, setEmailInput] = useState("");
  const [busy, setBusy] = useState(false);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  async function signInMagicLink() {
    if (!supabase || !emailInput) return;
    setBusy(true);
    try {
      await supabase.auth.signInWithOtp({
        email: emailInput,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback?next=/workspace` : undefined,
        },
      });
      alert("Magic link sent. Check your email.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    setBusy(true);
    try {
      await supabase.auth.signOut();
      await onRefresh();
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return <div className="panel p-4 text-sm text-slate-500">Checking auth...</div>;
  }

  if (demoMode) {
    return (
      <div className="panel flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-500">Guest mode active</p>
          <p className="text-sm text-slate-500">Local mode enabled. Add Supabase keys for team login.</p>
        </div>
      </div>
    );
  }

  if (loggedIn) {
    return (
      <div className="panel flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-500">Signed in</p>
          <p className="text-sm text-slate-600">{email}</p>
        </div>
        <button
          onClick={signOut}
          disabled={busy}
          className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="panel space-y-3 p-4">
      <p className="text-sm text-slate-600">Sign in with Supabase magic link</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className="input"
          placeholder="you@domain.com"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
        />
        <button
          onClick={signInMagicLink}
          disabled={busy || !emailInput}
          className="btn-primary inline-flex items-center justify-center gap-2"
        >
          <Mail className="h-4 w-4" />
          Send link
        </button>
      </div>
    </div>
  );
}
