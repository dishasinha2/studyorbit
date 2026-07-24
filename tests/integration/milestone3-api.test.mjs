import test from "node:test";
import assert from "node:assert/strict";

const baseUrl = process.env.TEST_BASE_URL;
const userId = process.env.TEST_USER_ID || `milestone3-${Date.now()}`;

function headers(extra = {}) {
  return {
    "Content-Type": "application/json",
    "x-user-id": userId,
    ...extra,
  };
}

async function jsonFetch(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, options);
  const body = await res.json().catch(() => null);
  return { res, body };
}

test("Milestone 3 APIs smoke test", { skip: !baseUrl }, async () => {
  const activity = await jsonFetch("/api/gamification", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ xp: 7 }),
  });
  assert.equal(activity.res.status, 200);
  assert.ok(activity.body.gamification.xpPoints >= 7);

  const preferences = await jsonFetch("/api/notifications/preferences", {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ channels: ["EMAIL", "WEB_PUSH"], learningReminder: true, timezone: "Asia/Calcutta" }),
  });
  assert.equal(preferences.res.status, 200);
  assert.deepEqual(preferences.body.preferences.channels, ["EMAIL", "WEB_PUSH"]);

  const reminder = await jsonFetch("/api/notifications/reminders", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      title: "Practice interview",
      kind: "interview",
      dueAt: new Date(Date.now() + 86_400_000).toISOString(),
      channels: ["EMAIL", "WEB_PUSH"],
    }),
  });
  assert.equal(reminder.res.status, 201);
  assert.equal(reminder.body.reminder.kind, "interview");

  const chat = await jsonFetch("/api/ai/chat", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ message: "Create a resume improvement roadmap for frontend developer roles." }),
  });
  assert.equal(chat.res.status, 200);
  assert.ok(chat.body.message.content.length > 20);

  const summary = await jsonFetch("/api/gamification", { headers: headers() });
  assert.equal(summary.res.status, 200);
  assert.ok(summary.body.gamification.currentStreak >= 1);

  const cleanup = await jsonFetch("/api/profile", {
    method: "DELETE",
    headers: headers(),
    body: JSON.stringify({ action: "clear_workspace" }),
  });
  assert.equal(cleanup.res.status, 200);
});
