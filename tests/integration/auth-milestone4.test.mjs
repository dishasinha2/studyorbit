import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import {
  getFirebaseAuthConfig,
  isFirebaseAuthConfigured,
  summarizeAuthConfig,
} from "../../src/lib/auth-config.ts";
import { assertResourceOwnership } from "../../src/lib/auth-ownership.ts";

const ORIGINAL_ENV = { ...process.env };

test("auth configuration reports the required Firebase variables", () => {
  const config = getFirebaseAuthConfig();

  assert.equal(typeof config.apiKey, "string");
  assert.equal(typeof config.authDomain, "string");
  assert.equal(typeof config.projectId, "string");
  assert.ok(config.apiKey.length > 0 || config.authDomain.length > 0 || config.projectId.length > 0 || !config.isConfigured);
});

test("auth configuration summary flags missing required Firebase variables clearly", () => {
  const previousApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const previousAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const previousProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  delete process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  try {
    const config = getFirebaseAuthConfig();
    const summary = summarizeAuthConfig(config);

    assert.equal(config.isConfigured, false);
    assert.match(summary, /NEXT_PUBLIC_FIREBASE_API_KEY/i);
    assert.match(summary, /NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN/i);
    assert.match(summary, /NEXT_PUBLIC_FIREBASE_PROJECT_ID/i);
  } finally {
    if (previousApiKey === undefined) delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    else process.env.NEXT_PUBLIC_FIREBASE_API_KEY = previousApiKey;

    if (previousAuthDomain === undefined) delete process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    else process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = previousAuthDomain;

    if (previousProjectId === undefined) delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    else process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = previousProjectId;
  }
});

test("auth configuration helper reflects the runtime Firebase setup state", () => {
  const config = getFirebaseAuthConfig();

  assert.equal(isFirebaseAuthConfigured(), config.isConfigured);
});

test("ownership checks block cross-user access for documents, conversations, roadmaps, and profile", () => {
  const userA = "user-a";
  const userB = "user-b";

  const resourceTypes = ["documents", "conversations", "roadmaps", "profile"];

  for (const resourceType of resourceTypes) {
    assert.throws(
      () => assertResourceOwnership({ currentUserId: userA, resourceOwnerId: userB, resourceType }),
      /does not belong to the current user/i,
    );
  }

  assert.doesNotThrow(() => assertResourceOwnership({ currentUserId: userA, resourceOwnerId: userA, resourceType: "profile" }));
});

test("ownership checks preserve the current user scope for successful access", () => {
  assert.doesNotThrow(() => assertResourceOwnership({ currentUserId: "user-a", resourceOwnerId: "user-a", resourceType: "documents" }));
});

test("auth page wires Firebase email, password, Google, and reset flows", () => {
  const authPage = readFileSync(path.resolve("src/app/auth/page.tsx"), "utf8");
  const firebaseClient = readFileSync(path.resolve("src/lib/firebase-client.ts"), "utf8");

  assert.match(authPage, /signInWithGoogleCredential/i);
  assert.match(authPage, /signInWithEmail/i);
  assert.match(authPage, /signUpWithEmail/i);
  assert.match(authPage, /sendPasswordReset/i);
  assert.match(authPage, /Google/i);
  assert.match(firebaseClient, /accounts:signInWithPassword/i);
  assert.match(firebaseClient, /accounts:signUp/i);
  assert.match(firebaseClient, /accounts:sendOobCode/i);
});

test("logout and server session persistence helpers use Firebase auth cookies", () => {
  const siteNav = readFileSync(path.resolve("src/components/site-nav.tsx"), "utf8");
  const authCookie = readFileSync(path.resolve("src/lib/auth-cookie.ts"), "utf8");
  const middleware = readFileSync(path.resolve("middleware.ts"), "utf8");
  const authPanel = readFileSync(path.resolve("src/components/auth-panel.tsx"), "utf8");

  assert.match(siteNav, /signOut\(\)/i);
  assert.match(siteNav, /clearFirebaseSession/i);
  assert.match(authCookie, /persistServerSession/i);
  assert.match(authCookie, /studyorbit-firebase-id-token/i);
  assert.match(middleware, /verifyFirebaseIdToken/i);
  assert.match(authPanel, /signInWithEmail/i);
  assert.doesNotMatch(authPanel, /createSupabaseBrowserClient/i);
});

process.on("exit", () => {
  process.env = { ...ORIGINAL_ENV };
});
