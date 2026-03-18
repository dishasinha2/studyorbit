export type ArtifactType = "NOTE" | "LINK" | "FILE" | "TASK" | "CALENDAR" | "EMAIL";
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export const artifactTypes: ArtifactType[] = ["NOTE", "LINK", "FILE", "TASK", "CALENDAR", "EMAIL"];

export type Project = {
  id: string;
  title: string;
  summary: string | null;
  color: string;
  _count?: { artifacts: number };
};

export type Artifact = {
  id: string;
  title: string;
  content: string;
  type: ArtifactType;
  source: string | null;
  contextKey: string | null;
  dueAt: string | null;
  occurredAt: string | null;
  isDone: boolean;
  status: TaskStatus;
  createdAt: string;
  project: { id: string; title: string; color: string } | null;
};

export type PlannerEvent = {
  id: string;
  title: string;
  notes: string | null;
  startAt: string;
  endAt: string | null;
  reminderAt: string | null;
  isImportant: boolean;
  isDone: boolean;
};

export type StickyNote = {
  id: string;
  content: string;
  color: string;
  isPinned: boolean;
  updatedAt: string;
};

export type Whiteboard = {
  id: string;
  title: string;
  dataJson: string;
  updatedAt: string;
};

export type VideoBookmark = {
  id: string;
  title: string;
  url: string;
  comment: string | null;
  tags: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
};

export type FileItem = {
  id: string;
  name: string;
  pathOrUrl: string;
  originalFileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  hasStoredFile: boolean;
  category: string | null;
  subject: string | null;
  tags: string | null;
  lastPosition: string | null;
  progressNote: string | null;
  isCompleted: boolean;
  createdAt: string;
};

export type FocusSession = {
  id: string;
  durationMin: number;
  breakMin: number;
  screenLimitMin: number | null;
  blockedList: string | null;
  note: string | null;
  startedAt: string;
  endedAt: string | null;
};
