export type WorkspaceRevisionEntry = {
  id: string;
  label: string;
  detail: string;
  timestamp: string;
};

export type WorkspaceState = {
  progress: number;
  isBookmarked: boolean;
  revisionHistory: WorkspaceRevisionEntry[];
  lastUpdated: string | null;
};

export type StoredDocumentSummary = {
  documentSummary: string | null;
  workspace: WorkspaceState;
};

export function createDefaultWorkspaceState(): WorkspaceState {
  return {
    progress: 0,
    isBookmarked: false,
    revisionHistory: [],
    lastUpdated: null,
  };
}

export function parseStoredDocumentSummary(summary: string | null | undefined): StoredDocumentSummary {
  if (!summary) {
    return { documentSummary: null, workspace: createDefaultWorkspaceState() };
  }

  try {
    const parsed = JSON.parse(summary) as Partial<StoredDocumentSummary>;
    if (parsed && typeof parsed === "object") {
      return {
        documentSummary: typeof parsed.documentSummary === "string" ? parsed.documentSummary : null,
        workspace: {
          progress: typeof parsed.workspace?.progress === "number" ? parsed.workspace.progress : 0,
          isBookmarked: Boolean(parsed.workspace?.isBookmarked),
          revisionHistory: Array.isArray(parsed.workspace?.revisionHistory)
            ? parsed.workspace.revisionHistory.filter((entry): entry is WorkspaceRevisionEntry => Boolean(entry && typeof entry === "object" && typeof entry.label === "string" && typeof entry.detail === "string" && typeof entry.timestamp === "string"))
            : [],
          lastUpdated: typeof parsed.workspace?.lastUpdated === "string" ? parsed.workspace.lastUpdated : null,
        },
      };
    }
  } catch {
    return { documentSummary: summary, workspace: createDefaultWorkspaceState() };
  }

  return { documentSummary: null, workspace: createDefaultWorkspaceState() };
}

export function serializeStoredDocumentSummary(documentSummary: string | null | undefined, workspace: WorkspaceState) {
  return JSON.stringify({
    documentSummary: documentSummary ?? null,
    workspace: {
      ...workspace,
      revisionHistory: workspace.revisionHistory.slice(0, 20),
    },
  });
}

export function appendRevisionEntry(workspace: WorkspaceState, label: string, detail: string) {
  const entry: WorkspaceRevisionEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    detail,
    timestamp: new Date().toISOString(),
  };

  return {
    ...workspace,
    revisionHistory: [entry, ...workspace.revisionHistory].slice(0, 12),
    lastUpdated: entry.timestamp,
  };
}
