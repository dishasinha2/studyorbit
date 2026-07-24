"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { AuthTabs, type AuthMode } from "./auth-tabs";

type AuthCardProps = {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  email: string;
  name: string;
  password: string;
  busy: boolean;
  authReady: boolean;
  message: string;
  errorMessage: string;
  onEmailChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onGoogle: () => void;
};

export function AuthCard(props: AuthCardProps) {
  const {
    mode,
    busy,
    authReady,
    email,
    name,
    password,
    message,
    errorMessage,
    onModeChange,
    onEmailChange,
    onNameChange,
    onPasswordChange,
    onSubmit,
    onGoogle,
  } = props;

  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const reduceMotion = useReducedMotion();

  const isFormValid =
    email.trim().length > 0 &&
    (mode === "reset" || password.length >= 6);

  const submitDisabled = busy || !authReady || !isFormValid;

  const submitLabel =
    mode === "reset"
      ? "Send reset link"
      : mode === "signup"
      ? "Launch my orbit"
      : "Enter orbit";

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="card relative mx-auto w-full max-w-[400px] rounded-[24px] border border-[rgba(241,239,255,0.10)] bg-[rgba(18,21,48,0.48)] p-6 backdrop-blur-xl shadow-[0_24px_60px_-28px_rgba(0,0,0,0.65)] sm:p-7"
    >
      {/* Auth Mode Tabs */}
      <AuthTabs mode={mode} onChange={onModeChange} />

      {/* Headline */}
      <div className="mb-5 mt-5 space-y-1">
        <h2 className="font-['Space_Grotesk'] text-xl font-semibold text-[var(--ink)]">
          {mode === "signup"
            ? "Start your orbit"
            : mode === "reset"
            ? "Reset password"
            : "Welcome back"}
        </h2>
        <p className="text-xs sm:text-sm text-[var(--ink-dim)]">
          {mode === "signup"
            ? "Set up your space in under a minute."
            : mode === "reset"
            ? "We'll send password recovery instructions."
            : "Pick up right where your last session left off."}
        </p>
      </div>

      {/* Form Container */}
      <form
        id={`auth-panel-${mode}`}
        role="tabpanel"
        aria-labelledby={`auth-tab-${mode}`}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-3"
      >
        <AnimatePresence mode="wait" initial={false}>
          {/* Full Name field (Signup mode) */}
          {mode === "signup" && (
            <motion.div
              key="name-field"
              initial={reduceMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-1.5"
            >
              <label
                htmlFor="auth-fullname"
                className="block font-['JetBrains_Mono'] text-[10.5px] uppercase tracking-[0.05em] text-[var(--ink-dim)]"
              >
                Full Name
              </label>
              <input
                id="auth-fullname"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Ananya Sharma"
                className="h-10 w-full rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.04)] px-3.5 font-sans text-sm text-[var(--ink)] outline-none placeholder:text-[rgba(156,151,196,0.55)] transition-all duration-200 focus:border-[var(--nebula)] focus:bg-[rgba(139,127,255,0.05)] focus:shadow-[0_0_0_3px_rgba(139,127,255,0.18)]"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email Address */}
        <div className="space-y-1.5">
          <label
            htmlFor="auth-email"
            className="block font-['JetBrains_Mono'] text-[10.5px] uppercase tracking-[0.05em] text-[var(--ink-dim)]"
          >
            Email
          </label>
          <input
            id="auth-email"
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="you@college.edu"
            className="h-10 w-full rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.04)] px-3.5 font-sans text-sm text-[var(--ink)] outline-none placeholder:text-[rgba(156,151,196,0.55)] transition-all duration-200 focus:border-[var(--nebula)] focus:bg-[rgba(139,127,255,0.05)] focus:shadow-[0_0_0_3px_rgba(139,127,255,0.18)]"
          />
        </div>

        {/* Password (Login & Signup modes) */}
        {mode !== "reset" && (
          <div className="space-y-1.5">
            <label
              htmlFor="auth-password"
              className="block font-['JetBrains_Mono'] text-[10.5px] uppercase tracking-[0.05em] text-[var(--ink-dim)]"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="auth-password"
                required
                minLength={6}
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder={mode === "signup" ? "Create a password" : "••••••••"}
                className="h-10 w-full rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.04)] pl-3.5 pr-10 font-sans text-sm text-[var(--ink)] outline-none placeholder:text-[rgba(156,151,196,0.55)] transition-all duration-200 focus:border-[var(--nebula)] focus:bg-[rgba(139,127,255,0.05)] focus:shadow-[0_0_0_3px_rgba(139,127,255,0.18)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-2.5 text-[var(--ink-faint)] hover:text-[var(--ink)]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Checkbox row & Forgot password */}
        <div className="flex items-center justify-between pt-1 text-xs text-[var(--ink-dim)]">
          {mode === "login" ? (
            <>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="accent-[var(--nebula)] rounded"
                />
                Keep me signed in
              </label>
              <button
                type="button"
                onClick={() => onModeChange("reset")}
                className="text-[var(--nebula)] hover:underline"
              >
                Forgot password?
              </button>
            </>
          ) : mode === "signup" ? (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" required defaultChecked className="accent-[var(--nebula)] rounded" />
              I agree to the terms
            </label>
          ) : null}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitDisabled}
          className="submit relative h-10 w-full overflow-hidden rounded-xl bg-[linear-gradient(135deg,var(--nebula),#6e5fe0)] font-['Space_Grotesk'] text-sm font-semibold tracking-[0.01em] text-white shadow-[0_8px_20px_-8px_rgba(139,127,255,0.55)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_12px_24px_-8px_rgba(139,127,255,0.7)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="ring-pulse absolute inset-0 rounded-xl border border-white/50 opacity-0 transition-opacity hover:opacity-100" />
          {busy ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-white" />
          ) : (
            <span>{submitLabel}</span>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3 font-['JetBrains_Mono'] text-[11.5px] text-[var(--ink-dim)]">
        <div className="h-px flex-1 bg-[var(--line)]" />
        <span>or continue with</span>
        <div className="h-px flex-1 bg-[var(--line)]" />
      </div>

      {/* Google Auth Button */}
      <button
        type="button"
        disabled={busy || !authReady}
        onClick={onGoogle}
        className="flex h-10 w-full items-center justify-center gap-2.5 rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.04)] text-sm font-medium text-[var(--ink)] transition-all duration-200 hover:scale-[1.02] hover:border-[rgba(139,127,255,0.3)] hover:bg-[rgba(255,255,255,0.08)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M21.6 12.23c0-.74-.06-1.45-.18-2.13H12v4.03h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.42Z"
          />
          <path
            fill="#34A853"
            d="M12 22c2.7 0 4.96-.89 6.61-2.42l-3.24-2.5c-.89.6-2.04.96-3.37.96-2.59 0-4.79-1.75-5.58-4.1H3.06v2.58A10 10 0 0 0 12 22Z"
          />
          <path
            fill="#FBBC05"
            d="M6.42 13.94a6.01 6.01 0 0 1 0-3.88V7.48H3.06a10 10 0 0 0 0 9.04l3.36-2.58Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.47 0 2.79.5 3.82 1.49l2.86-2.86A9.97 9.97 0 0 0 12 2C7.3 2 3.32 4.69 1.42 8.58l3.36 2.58C5.58 8.8 7.78 7.05 10.37 7.05h1.63v-1.67Z"
          />
        </svg>
        <span>Google Account</span>
      </button>

      {/* Status Messages */}
      {message && (
        <div
          role="status"
          className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-200"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-rose-200"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Switch mode footer */}
      <div className="mt-5 text-center text-xs text-[var(--ink-dim)]">
        {mode === "login" ? (
          <>
            New here?{" "}
            <button
              type="button"
              onClick={() => onModeChange("signup")}
              className="font-semibold text-[var(--gold)] hover:underline ml-1 cursor-pointer"
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => onModeChange("login")}
              className="font-semibold text-[var(--gold)] hover:underline ml-1 cursor-pointer"
            >
              Log in
            </button>
          </>
        )}
      </div>

      {/* Return Home Link */}
      <div className="mt-5 border-t border-[var(--line)] pt-4 text-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-[var(--ink-dim)] hover:text-[var(--ink)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Return to Home
        </Link>
      </div>
    </motion.div>
  );
}


