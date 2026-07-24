"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppSurface } from "@/components/app-surface";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { AuthCard } from "@/components/auth/auth-card";
import { OrbitHero } from "@/components/auth/orbit-hero";
import { Starfield } from "@/components/auth/starfield";
import { getFirebaseAuthConfig, summarizeAuthConfig } from "@/lib/auth-config";
import {
  readStoredSession,
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogleCredential,
  signUpWithEmail,
} from "@/lib/firebase-client";

function redirectNow(router: ReturnType<typeof useRouter>, href: string) {
  if (typeof window !== "undefined") window.location.assign(href);
  else router.replace(href);
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const authConfig = useMemo(() => getFirebaseAuthConfig(), []);
  const nextHref = searchParams.get("next") || "/dashboard";
  const authReady = authConfig.isConfigured;

  useEffect(() => {
    if (readStoredSession()) redirectNow(router, nextHref);
  }, [router, nextHref]);

  async function submitGoogle() {
    setBusy(true);
    setMessage("");
    setErrorMessage("");
    try {
      if (!authReady) {
        setErrorMessage(summarizeAuthConfig(authConfig));
        return;
      }
      await signInWithGoogleCredential();
      redirectNow(router, nextHref);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign in with Google.");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    setBusy(true);
    setMessage("");
    setErrorMessage("");
    try {
      if (!authReady) {
        setErrorMessage(summarizeAuthConfig(authConfig));
        return;
      }
      if (mode === "reset") {
        await sendPasswordReset(cleanEmail);
        setMessage("Password reset email sent.");
        return;
      }
      if (mode === "signup") {
        await signUpWithEmail(cleanEmail, password, cleanName || undefined);
      } else {
        await signInWithEmail(cleanEmail, password);
      }
      redirectNow(router, nextHref);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppSurface>
      <div className="relative min-h-[85vh] w-full space-y-6">
        <Starfield />
        <SiteNav active="auth" />

        <main className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 py-4 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
          <OrbitHero />
          <div className="relative z-10 flex justify-center">
            <AuthCard
              mode={mode}
              onModeChange={setMode}
              email={email}
              name={name}
              password={password}
              busy={busy}
              authReady={authReady}
              message={message}
              errorMessage={errorMessage || (!authReady ? summarizeAuthConfig(authConfig) : "")}
              onEmailChange={setEmail}
              onNameChange={setName}
              onPasswordChange={setPassword}
              onSubmit={() => void submit()}
              onGoogle={() => void submitGoogle()}
            />
          </div>
        </main>

        <SiteFooter />
      </div>
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
