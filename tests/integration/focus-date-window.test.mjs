import test from "node:test";
import assert from "node:assert/strict";

import { getFocusDayWindow } from "../../src/lib/focus-date-window.ts";

test("focus day window uses the local date boundary instead of the post-completion timestamp", () => {
  const sessionStart = new Date("2026-08-12T23:45:00-04:00");
  const day = getFocusDayWindow(sessionStart);

  assert.equal(day.start.getHours(), 0);
  assert.equal(day.start.getMinutes(), 0);
  assert.equal(day.start.getSeconds(), 0);
  assert.equal(day.end.getTime() - day.start.getTime(), 24 * 60 * 60 * 1000);

  const completionTime = new Date("2026-08-13T00:10:00-04:00");
  const dayFromCompletion = getFocusDayWindow(completionTime);
  assert.equal(dayFromCompletion.start.getDate(), completionTime.getDate());
  assert.equal(dayFromCompletion.start.getHours(), 0);
  assert.equal(dayFromCompletion.end.getTime() - dayFromCompletion.start.getTime(), 24 * 60 * 60 * 1000);
});
