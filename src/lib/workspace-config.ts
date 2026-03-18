import type { LucideIcon } from "lucide-react";
import { CalendarCheck, FileStack, Inbox, Link2, PenSquare, Timer, Youtube } from "lucide-react";

export type WorkspaceModuleId =
  | "quick-capture"
  | "dashboard"
  | "study-organizer"
  | "timeline"
  | "planner-insights"
  | "files"
  | "videos"
  | "notes"
  | "study-links"
  | "search"
  | "focus-lab"
  | "all";

export type WorkspaceSidebarItem = {
  id: Exclude<WorkspaceModuleId, "all">;
  label: string;
  icon: LucideIcon;
  meta: string;
};

export const workspaceSidebarItems: WorkspaceSidebarItem[] = [
  { id: "quick-capture", label: "Quick Capture", icon: Inbox, meta: "Capture fast" },
  { id: "dashboard", label: "Task Schedule", icon: CalendarCheck, meta: "Plan and track" },
  { id: "files", label: "File Management", icon: FileStack, meta: "Store study material" },
  { id: "videos", label: "YouTube Store", icon: Youtube, meta: "Save learning videos" },
  { id: "notes", label: "Notes", icon: PenSquare, meta: "Write and revise" },
  { id: "study-links", label: "GPT Link Store", icon: Link2, meta: "Keep useful prompts" },
  { id: "focus-lab", label: "Focus Timer", icon: Timer, meta: "Deep work sessions" },
];
