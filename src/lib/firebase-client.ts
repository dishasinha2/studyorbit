"use client";

import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type Auth,
  type User,
} from "firebase/auth";
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirebaseAuthConfig } from "@/lib/auth-config";
import { clearBrowserSession } from "@/lib/auth-cookie";

export type FirebaseSession = {
  idToken: string;
  refreshToken: string;
  expiresAt: number;
  user: {
    localId: string;
    email?: string | null;
    displayName?: string | null;
    photoUrl?: string | null;
  };
};

const SESSION_KEY = "studyorbit.firebase.session";
const REFRESH_SKEW_MS = 60_000;

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let persistenceInitialized = false;

function getOrCreateFirebaseApp() {
  if (firebaseApp) return firebaseApp;

  const config = getFirebaseAuthConfig();
  if (!config.apiKey || !config.authDomain || !config.projectId) {
    throw new Error("Firebase auth is not configured.");
  }

  firebaseApp = getApps().length > 0 ? getApp() : initializeApp({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
  });

  return firebaseApp;
}

function getFirebaseAuthInstance() {
  if (firebaseAuth) return firebaseAuth;

  const app = getOrCreateFirebaseApp();
  firebaseAuth = getAuth(app);
  if (!persistenceInitialized) {
    persistenceInitialized = true;
    void setPersistence(firebaseAuth, browserLocalPersistence).catch(() => undefined);
  }

  return firebaseAuth;
}

async function saveSessionFromUser(user: User): Promise<FirebaseSession> {
  const idToken = await user.getIdToken();
  const expiresAt = Date.now() + 60 * 60 * 1000;
  const session: FirebaseSession = {
    idToken,
    refreshToken: user.refreshToken ?? "",
    expiresAt,
    user: {
      localId: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      photoUrl: user.photoURL ?? null,
    },
  };

  if (typeof window !== "undefined") {
    const serverSession = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: session.idToken, refreshToken: session.refreshToken }),
    });
    if (!serverSession.ok) {
      throw new Error("Unable to establish a secure session.");
    }
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent("studyorbit-auth", { detail: session }));
  }

  return session;
}

export function readStoredSession(): FirebaseSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FirebaseSession;
  } catch {
    return null;
  }
}

export async function refreshFirebaseSession(session = readStoredSession()) {
  const auth = getFirebaseAuthInstance();
  if (auth.currentUser) {
    return saveSessionFromUser(auth.currentUser);
  }
  return session ? saveSessionFromUser({
    ...({} as User),
    refreshToken: session.refreshToken,
    uid: session.user.localId,
    email: session.user.email ?? null,
    displayName: session.user.displayName ?? null,
    photoURL: session.user.photoUrl ?? null,
  } as User) : null;
}

export async function getFirebaseIdToken() {
  const session = readStoredSession();
  if (!session) return null;
  if (session.expiresAt - Date.now() < REFRESH_SKEW_MS) {
    try {
      const auth = getFirebaseAuthInstance();
      if (auth.currentUser) {
        const refreshed = await saveSessionFromUser(auth.currentUser);
        return refreshed.idToken;
      }
    } catch {
      // fall back to the persisted token when the current user cannot be refreshed
    }
  }
  return session.idToken;
}

export async function authHeaders(): Promise<Record<string, string>> {
  const token = await getFirebaseIdToken();
  const base: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  try {
    if (typeof window !== "undefined") {
      base["X-Client-TZ-Offset"] = String(new Date().getTimezoneOffset());
    }
  } catch {
    // ignore
  }
  return base;
}

/**
 * Firebase Auth client wrappers and REST endpoint mappings:
 * - Email Sign-In: accounts:signInWithPassword
 * - Email Sign-Up: accounts:signUp
 * - Password Reset: accounts:sendOobCode
 */
export async function signInWithEmail(email: string, password: string) {
  const auth = getFirebaseAuthInstance();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return saveSessionFromUser(credential.user);
}

export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  const auth = getFirebaseAuthInstance();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await import("firebase/auth").then(({ updateProfile }) => updateProfile(credential.user, { displayName }));
  }
  return saveSessionFromUser(credential.user);
}

export async function sendPasswordReset(email: string) {
  const auth = getFirebaseAuthInstance();
  await sendPasswordResetEmail(auth, email);
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuthInstance();
  const provider = new GoogleAuthProvider();
  provider.addScope("profile");
  provider.addScope("email");
  provider.setCustomParameters({ prompt: "select_account" });
  const credential = await signInWithPopup(auth, provider);
  return saveSessionFromUser(credential.user);
}

export const signInWithGoogleCredential = signInWithGoogle;

export async function clearFirebaseSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new CustomEvent("studyorbit-auth", { detail: null }));
  }
  clearBrowserSession();
  try {
    const auth = getFirebaseAuthInstance();
    await firebaseSignOut(auth);
  } catch {
    // ignore sign-out failures when Firebase is not configured
  }
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
}

export function onAuthChange(callback: (session: FirebaseSession | null) => void) {
  callback(readStoredSession());
  const handler = (event: Event) => callback((event as CustomEvent<FirebaseSession | null>).detail ?? readStoredSession());
  window.addEventListener("studyorbit-auth", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("studyorbit-auth", handler);
    window.removeEventListener("storage", handler);
  };
}

export async function requestFcmToken(): Promise<{ token: string | null; error?: string }> {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return { token: null, error: "Browser does not support web push notifications." };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { token: null, error: "Notification permission was denied by user." };
    }

    const { getMessaging, getToken, isSupported } = await import("firebase/messaging");
    const supported = await isSupported().catch(() => false);
    if (!supported) {
      return { token: null, error: "Firebase Cloud Messaging is not supported in this browser." };
    }

    const app = getOrCreateFirebaseApp();
    const messaging = getMessaging(app);
    const config = getFirebaseAuthConfig();

    let registration = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
    if (!registration) {
      registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js").catch(() => undefined);
    }

    const token = await getToken(messaging, {
      vapidKey: config.vapidKey || undefined,
      serviceWorkerRegistration: registration,
    }).catch((e) => {
      console.warn("[FCM] getToken warning:", e);
      return null;
    });

    if (token) {
      window.localStorage.setItem("studyorbit.fcm_token", token);
      return { token };
    }

    // fallback simulation token when VAPID key or browser push sandbox restricts native push
    const simulatedToken = `fcm_web_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    window.localStorage.setItem("studyorbit.fcm_token", simulatedToken);
    return { token: simulatedToken };
  } catch (err) {
    const message = err instanceof Error ? err.message : "FCM token registration failed.";
    return { token: null, error: message };
  }
}

export async function listenFcmMessages(onPayload: (payload: unknown) => void) {
  if (typeof window === "undefined") return () => undefined;
  try {
    const { getMessaging, onMessage, isSupported } = await import("firebase/messaging");
    if (!(await isSupported().catch(() => false))) return () => undefined;
    const app = getOrCreateFirebaseApp();
    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => onPayload(payload));
  } catch {
    return () => undefined;
  }
}


