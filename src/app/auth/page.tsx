"use client";

import { Suspense, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { BrainCircuit, CalendarDays, ShieldCheck } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { getFirebaseAuthConfig, summarizeAuthConfig } from "@/lib/auth-config";
import { sendPasswordReset, signInWithEmail, signInWithGoogleCredential, signUpWithEmail } from "@/lib/firebase-client";

function AuthContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState(""); const [firstName, setFirstName] = useState(""); const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState(""); const [confirmPassword, setConfirmPassword] = useState(""); const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(""); const [errorMessage, setErrorMessage] = useState("");
  const authConfig = useMemo(() => getFirebaseAuthConfig(), []); const authReady = authConfig.isConfigured;
  const requestedNext = searchParams.get("next"); const nextHref = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/dashboard";
  async function complete(action: () => Promise<unknown>) { setBusy(true); setMessage(""); setErrorMessage(""); try { if (!authReady) throw new Error(summarizeAuthConfig(authConfig)); await action(); window.location.assign(nextHref); } catch (error) { setErrorMessage(error instanceof Error ? error.message : "Authentication failed."); } finally { setBusy(false); } }
  async function submit() { const cleanEmail = email.trim().toLowerCase(); if (mode === "reset") { setBusy(true); setMessage(""); setErrorMessage(""); try { if (!authReady) throw new Error(summarizeAuthConfig(authConfig)); await sendPasswordReset(cleanEmail); setMessage("Password reset email sent. Check your inbox."); } catch (error) { setErrorMessage(error instanceof Error ? error.message : "Unable to send the reset email."); } finally { setBusy(false); } return; } if (mode === "signup" && password !== confirmPassword) { setErrorMessage("Passwords must match."); return; } await complete(() => mode === "signup" ? signUpWithEmail(cleanEmail, password, `${firstName.trim()} ${lastName.trim()}`.trim()) : signInWithEmail(cleanEmail, password)); }
  return <main className="auth-scene">
  <div className="auth-stars" aria-hidden="true" /><div className="auth-orbit auth-orbit-a" aria-hidden="true" /><div className="auth-orbit auth-orbit-b" aria-hidden="true" /><div className="auth-orbit auth-orbit-c" aria-hidden="true" />
    <section className="auth-intro"><div className="auth-brand"><span>SO</span>StudyOrbit</div><p className="auth-badge">Your AI academic command center</p><h1>Your <em>AI Study</em> Workspace</h1><p className="auth-intro-copy">Everything you need to learn smarter, stay focused, and achieve more.</p><div className="auth-cube-wrap" aria-hidden="true"><div className="auth-cube"><span>SO</span></div><div className="auth-cube-ring auth-cube-ring-a" /><div className="auth-cube-ring auth-cube-ring-b" /><div className="auth-cube-floor" /></div></section>
    <section className="auth-form-wrap"><AuthCard mode={mode} onModeChange={setMode} email={email} firstName={firstName} lastName={lastName} password={password} confirmPassword={confirmPassword} busy={busy} authReady={authReady} message={message} errorMessage={errorMessage} onEmailChange={setEmail} onFirstNameChange={setFirstName} onLastNameChange={setLastName} onPasswordChange={setPassword} onConfirmPasswordChange={setConfirmPassword} onSubmit={() => void submit()} onGoogle={() => void complete(signInWithGoogleCredential)} /><p className="auth-secure"><ShieldCheck size={12}/> Secure & encrypted</p></section>
    <section className="auth-features"><Feature icon={<BrainCircuit/>} title="Focus Better" text="Pomodoro timer, focus sessions, and analytics."/><Feature icon={<CalendarDays/>} title="Plan Smarter" text="Deadlines, notes, and task management."/><Feature icon={<span className="auth-spark">✦</span>} title="Learn Faster" text="AI insights, summaries, and guidance."/></section>
  </main>;
}
function Feature({icon,title,text}:{icon:ReactNode;title:string;text:string}) { return <article><span>{icon}</span><div><h2>{title}</h2><p>{text}</p></div></article> }
export default function AuthPage(){return <Suspense fallback={<main className="auth-scene"/>}><AuthContent/></Suspense>}
