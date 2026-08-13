export function getFocusDayWindow(referenceDate: Date = new Date()) {
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export function isWithinFocusDay(date: Date, referenceDate: Date = new Date()) {
  const { start, end } = getFocusDayWindow(referenceDate);
  return date >= start && date < end;
}
