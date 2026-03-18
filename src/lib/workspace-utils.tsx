import type { Artifact } from "@/lib/types";

export function createDemoUserId() {
  if (typeof window === "undefined") return "demo-local";
  const cached = localStorage.getItem("dlife_demo_uid");
  if (cached) return cached;
  const id = `demo-${crypto.randomUUID()}`;
  localStorage.setItem("dlife_demo_uid", id);
  return id;
}

export function readDemoEmail() {
  if (typeof window === "undefined") return "demo@local";
  return localStorage.getItem("dlife_demo_email") ?? "demo@local";
}

export function toLabel(value: string | null) {
  if (!value) return "No time";
  return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function firstUrl(text: string) {
  const match = text.match(/https?:\/\/[^\s)]+/i);
  return match?.[0] ?? null;
}

export function renderHighlightedText(text: string) {
  const parts = text.split(/(==.*?==)/g);
  return parts.map((part, index) => {
    if (part.startsWith("==") && part.endsWith("==") && part.length > 4) {
      return (
        <mark key={`${part}-${index}`} className="rounded bg-amber-200/90 px-1 py-0.5 text-slate-950">
          {part.slice(2, -2)}
        </mark>
      );
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

export function renderRichNoteText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, lineIndex) => {
    const segments = line.split(/(==.*?==|\^\^.*?\^\^|\[(?:cyan|amber|rose|emerald)\].*?\[\/(?:cyan|amber|rose|emerald)\])/g);
    return (
      <span key={`line-${lineIndex}`} className="block">
        {segments.map((part, index) => {
          if (part.startsWith("==") && part.endsWith("==") && part.length > 4) {
            return (
              <mark key={`${part}-${index}`} className="rounded bg-amber-200/90 px-1 py-0.5 text-slate-950">
                {part.slice(2, -2)}
              </mark>
            );
          }
          if (part.startsWith("^^") && part.endsWith("^^") && part.length > 4) {
            return (
              <span key={`${part}-${index}`} className="underline decoration-cyan-300 decoration-2 underline-offset-2">
                {part.slice(2, -2)}
              </span>
            );
          }
          const colorMatch = part.match(/^\[(cyan|amber|rose|emerald)\](.*)\[\/\1\]$/);
          if (colorMatch) {
            const tone =
              colorMatch[1] === "cyan" ? "text-cyan-300" :
              colorMatch[1] === "amber" ? "text-amber-300" :
              colorMatch[1] === "rose" ? "text-rose-300" :
              "text-emerald-300";
            return <span key={`${part}-${index}`} className={tone}>{colorMatch[2]}</span>;
          }
          return <span key={`${part}-${index}`}>{part}</span>;
        })}
      </span>
    );
  });
}

export function timeUntilLabel(targetIso: string, nowTs: number) {
  const deltaSec = Math.round((new Date(targetIso).getTime() - nowTs) / 1000);
  if (deltaSec <= 0) return "now";
  const h = Math.floor(deltaSec / 3600);
  const m = Math.floor((deltaSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${Math.max(1, m)}m`;
}

export function taskStatusOf(task: Artifact) {
  return task.status ?? (task.isDone ? "COMPLETED" : "PENDING");
}

export function taskStatusLabel(status: string) {
  if (status === "COMPLETED") return "Completed";
  if (status === "IN_PROGRESS") return "In Progress";
  return "Pending";
}

export function taskStatusChipClass(status: string) {
  if (status === "COMPLETED") return "";
  if (status === "IN_PROGRESS") return "border-cyan-200 bg-cyan-50 text-cyan-700";
  return "chip-warn";
}
