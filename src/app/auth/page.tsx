"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import { AppSurface } from "@/components/app-surface";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

function humanizeAuthError(message: string, fallback: string) {
  const normalized = (message || fallback).toLowerCase();
  if (normalized.includes("rate limit")) return "Too many login emails were requested. Wait a few minutes and try again.";
  if (normalized.includes("invalid")) return "This email address looks invalid.";
  if (normalized.includes("fetch")) return "Could not reach auth service right now.";
  return message || fallback;
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<"form" | "check-email" | "code">("form");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const demoMode = !supabase;

  function getOrCreateDemoUserId() {
    const cached = localStorage.getItem("dlife_demo_uid");
    if (cached) return cached;
    const id = `demo-${crypto.randomUUID()}`;
    localStorage.setItem("dlife_demo_uid", id);
    return id;
  }

  function continueLocally(cleanEmail: string, infoMessage?: string) {
    getOrCreateDemoUserId();
    localStorage.setItem("dlife_demo_email", cleanEmail);
    setMessage(infoMessage ?? `${mode === "login" ? "Login" : "Signup"} successful. Redirecting...`);
    setTimeout(() => router.push("/dashboard"), 400);
  }

  function resetFeedback() {
    setMessage("");
    setErrorMessage("");
  }

  async function requestEmailAuth(kind: "magic-link" | "otp-code") {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage("Enter a valid email address.");
      return;
    }

    setBusy(true);
    resetFeedback();

    try {
      if (!supabase) {
        continueLocally(cleanEmail);
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo:
            kind === "magic-link" && typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback?next=/dashboard`
              : undefined,
          shouldCreateUser: mode === "signup",
        },
      });

      if (error) {
        throw error;
      }

      if (kind === "magic-link") {
        setMessage("Magic link sent. Check your email inbox.");
        setStep("check-email");
      } else {
        setMessage("Verification code sent. Check your email and enter the code.");
        setStep("code");
      }
    } catch (error) {
      const fallback = mode === "login" ? "Unable to send login link." : "Unable to create account via email link.";
      const detail = error instanceof Error ? error.message : fallback;
      const normalized = (detail || fallback).toLowerCase();

      if (normalized.includes("failed to fetch") || normalized.includes("fetch")) {
        continueLocally(cleanEmail, "Supabase is unreachable right now. Continued in local mode.");
        return;
      }

      setErrorMessage(humanizeAuthError(detail, fallback));
    } finally {
      setBusy(false);
    }
  }

  async function sendMagicLink() {
    await requestEmailAuth("magic-link");
  }

  async function sendOtpCode() {
    await requestEmailAuth("otp-code");
  }

  async function verifyOtpCode() {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = otpCode.trim();
    if (!cleanEmail || !cleanCode) {
      setErrorMessage("Enter the email and verification code.");
      return;
    }

    setBusy(true);
    resetFeedback();
    try {
      if (!supabase) {
        continueLocally(cleanEmail);
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanCode,
        type: mode === "signup" ? "signup" : "email",
      });

      if (error) {
        throw error;
      }

      setMessage("Verification successful. Redirecting...");
      router.push("/dashboard");
    } catch (error) {
      const fallback = "Unable to verify code.";
      const detail = error instanceof Error ? error.message : fallback;
      setErrorMessage(humanizeAuthError(detail, fallback));
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    setBusy(true);
    resetFeedback();
    try {
      if (!supabase) {
        continueLocally(email.trim().toLowerCase() || "google-demo@local", "Google auth is not configured locally. Continued in demo mode.");
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback?next=/dashboard` : undefined,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      const fallback = "Unable to start Google sign-in.";
      const detail = error instanceof Error ? error.message : fallback;
      setErrorMessage(humanizeAuthError(detail, fallback));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppSurface>
      <section className="mx-auto max-w-7xl space-y-6">
        <SiteNav active="auth" />

        <section className="mx-auto max-w-xl space-y-6">
          <header className="panel-strong hero-panel p-6">
            <p className="section-kicker">Secure Access</p>
            <h1 className="hero-title mt-2 text-3xl font-black tracking-tight">Login / Sign Up</h1>
            <p className="hero-lead mt-2 text-sm">Use the email login link for sign-in. OTP works only if your Supabase email template is configured for codes.</p>
          </header>

          <section className="panel p-6">
            {step === "form" ? (
              <>
                <div className="mb-4 grid grid-cols-2 gap-2">
                  <button className={`btn-secondary px-3 py-2 text-sm ${mode === "login" ? "ring-1 ring-cyan-300/60" : ""}`} onClick={() => setMode("login")}>
                    Login
                  </button>
                  <button className={`btn-secondary px-3 py-2 text-sm ${mode === "signup" ? "ring-1 ring-cyan-300/60" : ""}`} onClick={() => setMode("signup")}>
                    Sign Up
                  </button>
                </div>

                <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-cyan-500">
                  {mode === "login" ? "Login email" : "Sign up email"}
                </label>
                <input className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />

                <div className="mt-4 grid gap-2">
                  <button disabled={busy || !email.trim()} className="btn-primary inline-flex w-full items-center justify-center gap-2 px-4 py-2 text-sm disabled:opacity-40" onClick={sendMagicLink}>
                    <Mail className="h-4 w-4" /> {mode === "login" ? "Send Login Link" : "Create Account via Email Link"}
                  </button>
                  <button disabled={busy || !email.trim()} className="btn-secondary inline-flex w-full items-center justify-center gap-2 px-4 py-2 text-sm disabled:opacity-40" onClick={sendOtpCode}>
                    <KeyRound className="h-4 w-4" /> Send Verification Code
                  </button>
                  <button disabled={busy} className="btn-secondary inline-flex w-full items-center justify-center gap-2 px-4 py-2 text-sm disabled:opacity-40" onClick={signInWithGoogle}>
                    <span className="font-semibold">G</span> Continue with Google
                  </button>
                </div>
              </>
            ) : null}

            {step === "check-email" ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">Check your inbox for the login link sent to <span className="font-semibold">{email}</span>.</p>
                <div className="grid gap-2">
                  <button className="btn-primary inline-flex w-full items-center justify-center gap-2 px-4 py-2 text-sm" onClick={sendMagicLink} disabled={busy}>
                    <Mail className="h-4 w-4" /> Resend Login Link
                  </button>
                  <button className="btn-secondary inline-flex w-full items-center justify-center gap-2 px-4 py-2 text-sm" onClick={() => setStep("code")}>
                    <KeyRound className="h-4 w-4" /> Enter Verification Code Instead
                  </button>
                  <button className="btn-secondary inline-flex w-full items-center justify-center gap-2 px-4 py-2 text-sm" onClick={() => { setStep("form"); resetFeedback(); }}>
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                </div>
              </div>
            ) : null}

            {step === "code" ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-cyan-500">Email</label>
                  <input className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-cyan-500">Verification code</label>
                  <input className="input" placeholder="123456" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <button disabled={busy || !email.trim() || !otpCode.trim()} className="btn-primary inline-flex w-full items-center justify-center gap-2 px-4 py-2 text-sm disabled:opacity-40" onClick={verifyOtpCode}>
                    <KeyRound className="h-4 w-4" /> Verify Code
                  </button>
                  <button className="btn-secondary inline-flex w-full items-center justify-center gap-2 px-4 py-2 text-sm" onClick={sendOtpCode} disabled={busy || !email.trim()}>
                    <Mail className="h-4 w-4" /> Resend Code
                  </button>
                  <button className="btn-secondary inline-flex w-full items-center justify-center gap-2 px-4 py-2 text-sm" onClick={() => { setStep("form"); resetFeedback(); }}>
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                </div>
              </div>
            ) : null}

            {demoMode ? (
              <p className="mt-3 text-xs text-cyan-600">
                Demo mode active: Supabase keys are not set. Login/signup will continue locally.
              </p>
            ) : null}
            {!demoMode ? (
              <p className="mt-3 text-xs text-slate-500">
                If email code does not arrive, use the login link email instead and make sure Supabase redirect URLs include <span className="font-medium">/auth/callback</span>.
              </p>
            ) : null}
            {message ? <p className="mt-3 text-sm text-emerald-600">{message}</p> : null}
            {errorMessage ? <p className="mt-3 text-sm text-rose-500">{errorMessage}</p> : null}

            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <Link href="/" className="chip">Back to Intro</Link>
              <Link href="/dashboard" className="chip">Continue to Dashboard</Link>
              <Link href="/workspace" className="chip">Open Workspace</Link>
            </div>
          </section>
        </section>

        <SiteFooter />
      </section>
    </AppSurface>
  );
}
