"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { AppSurface } from "@/components/app-surface";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { persistBrowserSession } from "@/lib/auth-cookie";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

function humanizeAuthError(message: string, fallback: string) {
  const normalized = (message || fallback).toLowerCase();
  if (normalized.includes("rate limit")) return "Too many login emails were requested. Wait a few minutes and try again.";
  if (normalized.includes("invalid")) return "This email address looks invalid.";
  if (normalized.includes("fetch")) return "Could not reach auth service right now.";
  return message || fallback;
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<"form" | "check-email">("form");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const authReady = !!supabase;
  const nextHref = searchParams.get("next") || "/dashboard";

  function resetFeedback() {
    setMessage("");
    setErrorMessage("");
  }

  useEffect(() => {
    let active = true;
    async function checkExistingSession() {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      if (!active || !data.session) return;
      persistBrowserSession(data.session.access_token, data.session.refresh_token);
      router.replace(nextHref);
    }
    void checkExistingSession();
    return () => {
      active = false;
    };
  }, [supabase, router, nextHref]);

  async function requestEmailAuth() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage("Enter a valid email address.");
      return;
    }

    setBusy(true);
    resetFeedback();

    try {
      if (!supabase) {
        setErrorMessage("Supabase auth is not configured.");
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextHref)}` : undefined,
          shouldCreateUser: mode === "signup",
        },
      });

      if (error) {
        throw error;
      }

      setMessage("Magic link sent. Check your email inbox.");
      setStep("check-email");
    } catch (error) {
      const fallback = mode === "login" ? "Unable to send login link." : "Unable to create account via email link.";
      const detail = error instanceof Error ? error.message : fallback;
      const normalized = (detail || fallback).toLowerCase();

      setErrorMessage(humanizeAuthError(detail, fallback));
    } finally {
      setBusy(false);
    }
  }

  async function sendMagicLink() {
    await requestEmailAuth();
  }

  async function signInWithGoogle() {
    setBusy(true);
    resetFeedback();
    try {
      if (!supabase) {
        setErrorMessage("Supabase auth is not configured.");
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextHref)}` : undefined,
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
            <p className="hero-lead mt-2 text-sm">Use the magic link email from Supabase to sign in securely.</p>
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
                  <button className="btn-secondary inline-flex w-full items-center justify-center gap-2 px-4 py-2 text-sm" onClick={() => { setStep("form"); resetFeedback(); }}>
                    Back
                  </button>
                </div>
              </div>
            ) : null}

            {!authReady ? <p className="mt-3 text-xs text-rose-500">Supabase auth is not configured.</p> : null}
            {authReady ? <p className="mt-3 text-xs text-slate-500">Supabase is configured for magic links. Make sure redirect URLs include <span className="font-medium">/auth/callback</span>.</p> : null}
            {message ? <p className="mt-3 text-sm text-emerald-600">{message}</p> : null}
            {errorMessage ? <p className="mt-3 text-sm text-rose-500">{errorMessage}</p> : null}

            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              <Link href="/" className="chip">Back to Intro</Link>
            </div>
          </section>
        </section>

        <SiteFooter />
      </section>
    </AppSurface>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <AppSurface>
          <section className="mx-auto max-w-7xl space-y-6">
            <SiteNav active="auth" />
            <section className="mx-auto max-w-xl panel-strong p-8">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-500">Secure Access</p>
              <h1 className="mt-2 text-3xl font-black text-slate-700">Loading login</h1>
            </section>
            <SiteFooter />
          </section>
        </AppSurface>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
