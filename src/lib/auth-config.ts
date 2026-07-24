export type FirebaseAuthConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  googleClientId: string;
  vapidKey: string;
  isConfigured: boolean;
  missing: string[];
};

export function getFirebaseAuthConfig(): FirebaseAuthConfig {
  const apiKey = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "").trim();
  const authDomain = (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "").trim();
  const projectId = (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "").trim();
  const googleClientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim();
  const vapidKey = (process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "").trim();

  const missing = [
    !apiKey ? "NEXT_PUBLIC_FIREBASE_API_KEY" : null,
    !authDomain ? "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" : null,
    !projectId ? "NEXT_PUBLIC_FIREBASE_PROJECT_ID" : null,
  ].filter(Boolean) as string[];

  return {
    apiKey,
    authDomain,
    projectId,
    googleClientId,
    vapidKey,
    isConfigured: missing.length === 0,
    missing,
  };
}

export function isFirebaseAuthConfigured() {
  return getFirebaseAuthConfig().isConfigured;
}

export function summarizeAuthConfig(config: FirebaseAuthConfig = getFirebaseAuthConfig()) {
  if (config.isConfigured) {
    return "Firebase Authentication is configured. Email/password and Google Sign-In are ready.";
  }

  return `Missing required variables: ${config.missing.join(", ")}. Add Firebase web app credentials before starting StudyOrbit.`;
}

export function assertFirebaseAuthConfiguration(config: FirebaseAuthConfig = getFirebaseAuthConfig()) {
  if (!config.isConfigured) {
    throw new Error(summarizeAuthConfig(config));
  }

  return config;
}

