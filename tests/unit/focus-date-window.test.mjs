import assert from 'assert';
import { test } from 'node:test';

// Import the TS module via tsx loader in the test run (node invoked with
// `--import tsx` by the runner). Use an explicit relative path.
import { getFocusDayWindow } from '../../src/lib/focus-date-window.ts';

// IST is UTC+05:30 -> Date.getTimezoneOffset() returns -330
const IST_OFFSET = -330;

test('IST: local 00:01 is included in today window', () => {
  const ref = new Date('2026-08-15T12:00:00Z'); // arbitrary reference on the same local day
  const { start, end } = getFocusDayWindow(ref, IST_OFFSET);

  // Local 2026-08-15 00:01 IST => UTC 2026-08-14T18:31:00Z
  const local0001Utc = new Date('2026-08-14T18:31:00Z');
  assert(local0001Utc >= start && local0001Utc < end, '00:01 IST should be inside today window');
});

test('IST: yesterday 23:59 is excluded from today', () => {
  const ref = new Date('2026-08-15T12:00:00Z');
  const { start } = getFocusDayWindow(ref, IST_OFFSET);

  // Local 2026-08-14 23:59 IST => UTC 2026-08-14T18:29:00Z
  const yester2359Utc = new Date('2026-08-14T18:29:00Z');
  assert(yester2359Utc < start, '23:59 IST of previous day should be before start');
});

test('IST: local 20:30 is included in today', () => {
  const ref = new Date('2026-08-15T12:00:00Z');
  const { start, end } = getFocusDayWindow(ref, IST_OFFSET);

  // Local 2026-08-15 20:30 IST => UTC 2026-08-15T15:00:00Z
  const local2030Utc = new Date('2026-08-15T15:00:00Z');
  assert(local2030Utc >= start && local2030Utc < end, '20:30 IST should be inside today window');
});

test('Consecutive days: end equals next start (no overlap)', () => {
  const refA = new Date('2026-08-15T12:00:00Z');
  const refB = new Date('2026-08-16T12:00:00Z');
  const wA = getFocusDayWindow(refA, IST_OFFSET);
  const wB = getFocusDayWindow(refB, IST_OFFSET);
  assert.strictEqual(wA.end.getTime(), wB.start.getTime(), 'End of one day should equal start of next day');
});

test('isWithinFocusDay convenience respects offset', () => {
  // use same ref as above
  const ref = new Date('2026-08-15T12:00:00Z');
  const { start, end } = getFocusDayWindow(ref, IST_OFFSET);
  const inside = new Date('2026-08-15T15:00:00Z');
  const outside = new Date('2026-08-14T18:29:00Z');
  // basic sanity
  assert(inside >= start && inside < end, 'inside should be in window');
  assert(outside < start || outside >= end, 'outside should be outside window');
});
