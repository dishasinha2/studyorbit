"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppSurface } from "@/components/app-surface";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

function humanizeAuthError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("expired")) return "This login link expired. Request a new one.";
  if (normalized.includes("rate limit")) return "Too many login emails were requested. Wait a few minutes and try again.";
  if (normalized.includes("invalid")) return "This login link is invalid. Request a new one.";
  return message;
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!supabase) {
        router.replace("/dashboard");
        return;
      }

      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const next = searchParams.get("next") || "/dashboard";
      const urlError = searchParams.get("error_description") || searchParams.get("error");

      if (urlError) {
        setErrorMessage(humanizeAuthError(urlError.replace(/\+/g, " ")));
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!alive) return;
      if (sessionData.session) {
        router.replace(next);
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!alive) return;

        if (error) {
          setErrorMessage(humanizeAuthError(error.message || "Unable to complete login."));
          return;
        }

        router.replace(next);
        return;
      }

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "magiclink" | "signup" | "invite" | "recovery" | "email_change" | "email",
        });
        if (!alive) return;

        if (error) {
          setErrorMessage(humanizeAuthError(error.message || "Unable to verify login link."));
          return;
        }

        router.replace(next);
        return;
      }

      setErrorMessage("This sign-in link is incomplete. Request a new login email.");
    }

    void run();
    return () => {
      alive = false;
    };
  }, [router, searchParams, supabase]);

  return (
    <AppSurface>
      <section className="mx-auto max-w-5xl space-y-6">
        <SiteNav active="auth" />
        <section className="mx-auto max-w-xl panel-strong p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-500">Auth Callback</p>
          <h1 className="mt-2 text-3xl font-black text-slate-700">Completing sign in</h1>
          {errorMessage ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-rose-500">{errorMessage}</p>
              <Link href="/auth" className="btn-secondary inline-block px-4 py-2 text-sm">Back to login</Link>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Please wait...</p>
          )}
        </section>
        <SiteFooter />
      </section>
    </AppSurface>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <AppSurface>
          <section className="mx-auto max-w-5xl space-y-6">
            <SiteNav active="auth" />
            <section className="mx-auto max-w-xl panel-strong p-8">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-500">Auth Callback</p>
              <h1 className="mt-2 text-3xl font-black text-slate-700">Completing sign in</h1>
              <p className="mt-4 text-sm text-slate-500">Please wait...</p>
            </section>
            <SiteFooter />
          </section>
        </AppSurface>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
