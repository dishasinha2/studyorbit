export function SiteFooter() {
  return (
    <footer className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 text-[var(--ink-dim)] font-mono">
        <p className="font-semibold text-[var(--ink)]">StudyOrbit &copy; 2026</p>
        <div className="flex items-center gap-3">
          <span>PDFs</span>
          <span>&bull;</span>
          <span>Tasks</span>
          <span>&bull;</span>
          <span>Reminders</span>
          <span>&bull;</span>
          <span>Focus</span>
          <span>&bull;</span>
          <span>AI Guidance</span>
        </div>
      </div>
    </footer>
  );
}

