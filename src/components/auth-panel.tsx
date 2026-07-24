"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut, Mail, RotateCcw } from "lucide-react";
import { clearFirebaseSession, sendPasswordReset, signInWithEmail, signUpWithEmail } from "@/lib/firebase-client";

type AuthPanelProps = {
  ready: boolean;
  loggedIn: boolean;
  email?: string;
  demoMode: boolean;
  onRefresh: () => Promise<void>;
};

export function AuthPanel({ ready, loggedIn, email, demoMode, onRefresh }: AuthPanelProps) {
  const router = useRouter();
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submitEmailFlow() {
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || (mode !== "reset" && passwordInput.length < 6)) return;

    setBusy(true);
    setMessage("");
    try {
      if (mode === "reset") {
        await sendPasswordReset(cleanEmail);
        setMessage("Password reset email sent.");
      } else if (mode === "signup") {
        await signUpWithEmail(cleanEmail, passwordInput);
        setMessage("Account created. You are now signed in.");
      } else {
        await signInWithEmail(cleanEmail, passwordInput);
        setMessage("Signed in successfully.");
      }
      await onRefresh();
      router.replace("/workspace");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    try {
      await clearFirebaseSession();
      await onRefresh();
      router.replace("/auth");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return <div className="panel p-4 text-sm text-slate-500">Checking auth...</div>;
  }

  if (demoMode) {
    return <div className="panel p-4 text-sm text-rose-500">Firebase auth is required. Configure Firebase credentials to continue.</div>;
  }

  if (loggedIn) {
    return (
      <div className="panel flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-500">Signed in</p>
          <p className="text-sm text-slate-600">{email}</p>
        </div>
        <button
          onClick={() => void signOut()}
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
      <p className="text-sm text-slate-600">Sign in with Firebase email and password</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`btn-secondary px-3 py-2 text-sm ${mode === "login" ? "ring-1 ring-cyan-300/70" : ""}`} onClick={() => setMode("login")}>Login</button>
        <button type="button" className={`btn-secondary px-3 py-2 text-sm ${mode === "signup" ? "ring-1 ring-cyan-300/70" : ""}`} onClick={() => setMode("signup")}>Sign up</button>
        <button type="button" className={`btn-secondary px-3 py-2 text-sm ${mode === "reset" ? "ring-1 ring-cyan-300/70" : ""}`} onClick={() => setMode("reset")}>Reset</button>
      </div>
      <input
        className="input"
        placeholder="you@domain.com"
        value={emailInput}
        onChange={(event) => setEmailInput(event.target.value)}
      />
      {mode !== "reset" ? (
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={passwordInput}
          onChange={(event) => setPasswordInput(event.target.value)}
        />
      ) : null}
      <button
        type="button"
        onClick={() => void submitEmailFlow()}
        disabled={busy || !emailInput.trim() || (mode !== "reset" && passwordInput.length < 6)}
        className="btn-primary inline-flex items-center justify-center gap-2"
      >
        {mode === "reset" ? <RotateCcw className="h-4 w-4" /> : mode === "signup" ? <KeyRound className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
        {mode === "reset" ? "Send reset email" : mode === "signup" ? "Create account" : "Sign in"}
      </button>
      {message ? <p className="text-xs text-slate-500">{message}</p> : null}
    </div>
  );
}
