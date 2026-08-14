export function getFocusDayWindow(referenceDate: Date = new Date(), clientTzOffsetMinutes?: number) {
  // If the client timezone offset (minutes; matches Date.getTimezoneOffset())
  // is provided, compute the UTC window that corresponds to the client's
  // local calendar day. This ensures "today" aligns with the user's local
  // midnight regardless of the server timezone.
  if (typeof clientTzOffsetMinutes === "number" && Number.isFinite(clientTzOffsetMinutes)) {
    // Shift the reference instant so its UTC components reflect the
    // client's local wall-clock. Then read the UTC Y/M/D and build the
    // UTC timestamp for that day's local midnight.
    const clientNow = new Date(referenceDate.getTime() - clientTzOffsetMinutes * 60000);
    const year = clientNow.getUTCFullYear();
    const month = clientNow.getUTCMonth();
    const day = clientNow.getUTCDate();

    // UTC time that corresponds to local 00:00 is Date.UTC(...) + offset
    const startMs = Date.UTC(year, month, day, 0, 0, 0) + clientTzOffsetMinutes * 60000;
    const start = new Date(startMs);
    const end = new Date(startMs + 24 * 60 * 60 * 1000);
    return { start, end };
  }

  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export function isWithinFocusDay(date: Date, referenceDate: Date = new Date(), clientTzOffsetMinutes?: number) {
  const { start, end } = getFocusDayWindow(referenceDate, clientTzOffsetMinutes);
  return date >= start && date < end;
}
