"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  FileText,
  NotebookPen,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { authHeaders } from "@/lib/firebase-client";
import { appendRevisionEntry, parseStoredDocumentSummary } from "@/lib/document-workspace";

type DocumentDetail = {
  id: string;
  name: string;
  type: string;
  status: string;
  category: string | null;
  tags: string[];
  isFavorite: boolean;
  uploadedAt: string;
  sizeBytes: number;
  summary: string | null;
  documentSummary: string | null;
  workspace?: {
    progress: number;
    isBookmarked: boolean;
    revisionHistory: Array<{ id: string; label: string; detail: string; timestamp: string }>;
    lastUpdated: string | null;
  };
  folder: { id: string; name: string; color: string | null } | null;
};

type ArtifactItem = {
  id: string;
  title: string;
  content: string;
  type: string;
  source: string | null;
  dueAt: string | null;
  status: string | null;
  isDone: boolean;
  createdAt: string;
  contextKey: string | null;
};

type ChatMessage = {
  id: string;
  role: string;
  content: string;
};

export function DocumentWorkspacePanel({ documentId }: { documentId: string }) {
  const router = useRouter();
  const contextKey = useMemo(() => `document:${documentId}`, [documentId]);

  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [readProgress, setReadProgress] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [revisionHistory, setRevisionHistory] = useState<Array<{ id: string; label: string; detail: string; timestamp: string }>>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);

  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskContent, setTaskContent] = useState("");
  const [taskDueAt, setTaskDueAt] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [aiInput, setAiInput] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const workspaceLoaded = useRef(false);

  const syncDocumentWorkspace = useCallback(async (nextWorkspace?: Partial<{ progress: number; isBookmarked: boolean; revisionHistory: Array<{ id: string; label: string; detail: string; timestamp: string }>; lastUpdated: string | null }>) => {
    const headers = await authHeaders();
    if (!headers.Authorization || !document) return;

    const payload = {
      workspace: {
        progress: nextWorkspace?.progress ?? readProgress,
        isBookmarked: nextWorkspace?.isBookmarked ?? bookmarked,
        revisionHistory: nextWorkspace?.revisionHistory ?? revisionHistory,
        lastUpdated: nextWorkspace?.lastUpdated ?? new Date().toISOString(),
      },
      documentSummary: document.documentSummary ?? document.summary ?? null,
    };

    await fetch(`/api/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(payload),
    });
  }, [document, documentId, readProgress, bookmarked, revisionHistory]);

  const loadWorkspace = useCallback(async () => {
    const headers = await authHeaders();
    if (!headers.Authorization) return;

    const [docRes, artifactRes, conversationRes] = await Promise.all([
      fetch(`/api/documents/${documentId}`, { headers }),
      fetch(`/api/artifacts?contextKey=${encodeURIComponent(contextKey)}`, { headers }),
      fetch(`/api/ai/conversations?documentId=${encodeURIComponent(documentId)}`, { headers }),
    ]);

    if (docRes.ok) {
      const json = await docRes.json().catch(() => null);
      const loadedDocument = json?.document ?? null;
      setDocument(loadedDocument);
      if (loadedDocument?.workspace) {
        setReadProgress(loadedDocument.workspace.progress ?? 0);
        setBookmarked(Boolean(loadedDocument.workspace.isBookmarked));
        setRevisionHistory(loadedDocument.workspace.revisionHistory ?? []);
      } else {
        const parsedSummary = parseStoredDocumentSummary(loadedDocument?.summary ?? null);
        setReadProgress(parsedSummary.workspace.progress ?? 0);
        setBookmarked(Boolean(parsedSummary.workspace.isBookmarked));
        setRevisionHistory(parsedSummary.workspace.revisionHistory ?? []);
      }
    }

    if (artifactRes.ok) {
      const json = await artifactRes.json().catch(() => null);
      setArtifacts(json?.artifacts ?? []);
    }

    if (conversationRes.ok) {
      const conversationJson = await conversationRes.json().catch(() => null);
      const conversations = conversationJson?.conversations ?? [];
      const latestConversation = conversations[0];
      if (latestConversation?.id) {
        setActiveConversationId(latestConversation.id);
        const messagesRes = await fetch(`/api/ai/conversations/${latestConversation.id}/messages`, { headers });
        if (messagesRes.ok) {
          const messagesJson = await messagesRes.json().catch(() => null);
          const nextMessages = (messagesJson?.messages ?? []).map((entry: { id: string; role: string; content: string }) => ({
            id: entry.id,
            role: entry.role,
            content: entry.content,
          }));
          setChatMessages(nextMessages);
        }
      } else {
        setActiveConversationId(null);
        setChatMessages([]);
      }
    }
    workspaceLoaded.current = true;
  }, [documentId, contextKey]);

  useEffect(() => {
    workspaceLoaded.current = false;
    const id = requestAnimationFrame(() => {
      void loadWorkspace();
    });
    return () => cancelAnimationFrame(id);
  }, [documentId, contextKey, loadWorkspace]);

  useEffect(() => {
    if (!document || !workspaceLoaded.current) return;
    void syncDocumentWorkspace({ progress: readProgress, isBookmarked: bookmarked, revisionHistory, lastUpdated: new Date().toISOString() });
  }, [readProgress, bookmarked, revisionHistory, document, syncDocumentWorkspace]);

  async function toggleFavorite() {
    if (!document) return;
    const headers = await authHeaders();
    if (!headers.Authorization) return;

    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);
    setDocument((prev) => (prev ? { ...prev, isFavorite: nextBookmarked } : prev));
    setMessage(nextBookmarked ? "Bookmark saved." : "Bookmark removed.");
    await syncDocumentWorkspace({ progress: readProgress, isBookmarked: nextBookmarked, revisionHistory, lastUpdated: new Date().toISOString() });
  }

  async function setRevisionStatus(status: string) {
    const headers = await authHeaders();
    if (!headers.Authorization) return;

    const nextRevision = appendRevisionEntry({ progress: readProgress, isBookmarked: bookmarked, revisionHistory, lastUpdated: new Date().toISOString() }, "Revision status", `Set to ${status}`);
    setRevisionHistory(nextRevision.revisionHistory);
    const res = await fetch(`/api/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ status, workspace: { progress: readProgress, isBookmarked: bookmarked, revisionHistory: nextRevision.revisionHistory, lastUpdated: nextRevision.lastUpdated } }),
    });

    if (res.ok) {
      setDocument((prev) => (prev ? { ...prev, status } : prev));
      setMessage(`Revision status updated to ${status}.`);
    }
  }

  const persistDraftNote = useCallback(async () => {
    const headers = await authHeaders();
    if (!headers.Authorization) return;

    const title = noteTitle.trim();
    const content = noteContent.trim();
    if (!title && !content) return;

    setBusy(true);
    try {
      const payload = {
        title: title || "Untitled note",
        content,
        type: "NOTE" as const,
        contextKey,
      };

      const res = savedNoteId
        ? await fetch(`/api/artifacts/${savedNoteId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/artifacts", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify(payload),
          });

      if (res.ok) {
        const json = await res.json().catch(() => null);
        const nextId = savedNoteId ?? json?.artifact?.id ?? null;
        if (nextId) setSavedNoteId(nextId);
        await loadWorkspace();
      }
    } finally {
      setBusy(false);
    }
  }, [noteTitle, noteContent, contextKey, savedNoteId, loadWorkspace]);

  async function addArtifact(type: "NOTE" | "TASK" | "LINK") {
    const headers = await authHeaders();
    if (!headers.Authorization) return;

    let title = "";
    let content = "";
    let source: string | null = null;
    let dueAt: string | null = null;

    if (type === "NOTE") {
      title = noteTitle.trim();
      content = noteContent.trim();
      if (!title || !content) return;
    }

    if (type === "TASK") {
      title = taskTitle.trim();
      content = taskContent.trim();
      dueAt = taskDueAt || null;
      if (!title || !content) return;
    }

    if (type === "LINK") {
      title = linkTitle.trim();
      content = linkDescription.trim();
      source = linkUrl.trim() || null;
      if (!title || !source) return;
    }

    setBusy(true);
    try {
      const payload = {
        title,
        content,
        type,
        contextKey,
        source,
        dueAt,
      };
      const res = await fetch(savedNoteId ? `/api/artifacts/${savedNoteId}` : "/api/artifacts", {
        method: savedNoteId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const nextRevision = appendRevisionEntry({ progress: readProgress, isBookmarked: bookmarked, revisionHistory, lastUpdated: new Date().toISOString() }, type === "NOTE" ? "Note saved" : type === "TASK" ? "Task added" : "Link added", title);
        setRevisionHistory(nextRevision.revisionHistory);
        setMessage("Saved to this workspace.");
        setNoteTitle("");
        setNoteContent("");
        setSavedNoteId(null);
        setTaskTitle("");
        setTaskContent("");
        setTaskDueAt("");
        setLinkTitle("");
        setLinkUrl("");
        setLinkDescription("");
        await loadWorkspace();
      }
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!noteTitle.trim() && !noteContent.trim()) return;
    const timeout = window.setTimeout(() => {
      void persistDraftNote();
    }, 800);
    return () => window.clearTimeout(timeout);
  }, [noteTitle, noteContent, persistDraftNote]);

  async function sendAiMessage() {
    const messageToSend = aiInput.trim();
    if (!messageToSend) return;

    const headers = await authHeaders();
    if (!headers.Authorization) return;

    setAiBusy(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ message: messageToSend, documentId, conversationId: activeConversationId ?? undefined }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.message) {
        const nextRevision = appendRevisionEntry({ progress: readProgress, isBookmarked: bookmarked, revisionHistory, lastUpdated: new Date().toISOString() }, "AI conversation", messageToSend);
        setRevisionHistory(nextRevision.revisionHistory);
        if (data.conversationId) setActiveConversationId(data.conversationId);
        setChatMessages((prev) => [
          ...prev,
          { id: `${Date.now()}-user`, role: "USER", content: messageToSend },
          { id: data.message.id ?? `${Date.now()}-assistant`, role: data.message.role ?? "ASSISTANT", content: data.message.content ?? "" },
        ]);
        setAiInput("");
        setMessage("AI response ready.");
      }
    } finally {
      setAiBusy(false);
    }
  }

  const notes = artifacts.filter((item) => item.type === "NOTE");
  const tasks = artifacts.filter((item) => item.type === "TASK");
  const links = artifacts.filter((item) => item.type === "LINK");
  const youtubeLinks = links.filter((item) => /(?:youtube\.com|youtu\.be)/i.test(item.source ?? ""));

  return (
    <section className="panel shell-frame p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button type="button" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600" onClick={() => router.push("/documents")}>
            <ArrowLeft className="h-4 w-4" /> Back to documents
          </button>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            {document?.name ?? "Loading workspace..."}
          </h2>
          <p className="mt-1 text-sm text-slate-500">A focused study space for one PDF, its notes, tasks, and AI guidance.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" onClick={() => void toggleFavorite()}>
            {bookmarked ? <BookmarkCheck className="h-4 w-4 text-amber-500" /> : <Bookmark className="h-4 w-4" />} {bookmarked ? "Saved" : "Bookmark"}
          </button>
          <a href={`/api/documents/${documentId}/download`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
            <UploadCloud className="h-4 w-4" /> Download
          </a>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-800">PDF viewer</p>
                <p className="text-xs text-slate-500">Open the document in context while you study.</p>
              </div>
              <a href={`/api/documents/${documentId}/download`} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600">
                Open in tab
              </a>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {document?.type === "PDF" ? (
                <iframe src={`/api/documents/${documentId}/download`} title={document?.name ?? "Document preview"} className="h-[70vh] w-full" />
              ) : (
                <div className="flex h-[70vh] flex-col items-center justify-center gap-3 p-6 text-center">
                  <FileText className="h-10 w-10 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700">Preview is ready for this document.</p>
                  <a href={`/api/documents/${documentId}/download`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-2 text-sm font-medium text-white">
                    <ExternalLink className="h-4 w-4" /> Open source file
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-800">Reading progress</p>
                <p className="text-xs text-slate-500">Track your current position in the PDF.</p>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-sm font-semibold text-blue-700">{readProgress}%</span>
            </div>
            <input type="range" min="0" max="100" value={readProgress} onChange={(event) => setReadProgress(Number(event.target.value))} className="mt-4 h-2 w-full cursor-pointer" />
            <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-800">Revision status</p>
                <p className="text-xs text-slate-500">Keep a quick signal for review progress.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">{document?.status ?? "UPLOADED"}</span>
            </div>
            <p className="mt-3 text-sm text-slate-600">{document?.summary || "Add a short summary so the workspace stays meaningful over time."}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ${document?.status === "READY" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700"}`} onClick={() => void setRevisionStatus("READY")}>
                <CheckCircle2 className="h-4 w-4" /> Mark ready
              </button>
              <button type="button" className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ${document?.status === "INGESTING" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700"}`} onClick={() => void setRevisionStatus("INGESTING")}>
                <CircleDashed className="h-4 w-4" /> In review
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {revisionHistory.slice(0, 3).map((entry) => (
                <span key={entry.id} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
                  {entry.label}
                </span>
              ))}
              {document?.tags?.map((tag) => (
                <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
                  {tag}
                </span>
              ))}
            </div>
            {revisionHistory.length ? (
              <div className="mt-3 space-y-1 border-t border-slate-100 pt-3">
                {revisionHistory.slice(0, 5).map((entry) => (
                  <p key={entry.id} className="text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{entry.label}</span> · {entry.detail}
                  </p>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <NotebookPen className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-semibold text-slate-800">Linked notes</p>
            </div>
            <div className="mt-3 space-y-2">
              <input className="input" placeholder="Note title" value={noteTitle} onChange={(event) => setNoteTitle(event.target.value)} />
              <textarea className="input min-h-24" placeholder="Capture insights from this PDF" value={noteContent} onChange={(event) => setNoteContent(event.target.value)} />
              <button type="button" className="btn-primary px-3 py-2 text-sm" disabled={busy} onClick={() => void addArtifact("NOTE")}>Save note</button>
            </div>
            <div className="mt-3 space-y-2">
              {notes.length ? notes.map((note) => (
                <div key={note.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-800">{note.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{note.content}</p>
                </div>
              )) : <p className="text-sm text-slate-500">No notes linked yet.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-semibold text-slate-800">Tasks & deadlines</p>
            </div>
            <div className="mt-3 space-y-2">
              <input className="input" placeholder="Task title" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} />
              <textarea className="input min-h-20" placeholder="What needs to happen for this PDF?" value={taskContent} onChange={(event) => setTaskContent(event.target.value)} />
              <input className="input" type="datetime-local" value={taskDueAt} onChange={(event) => setTaskDueAt(event.target.value)} />
              <button type="button" className="btn-secondary px-3 py-2 text-sm" disabled={busy} onClick={() => void addArtifact("TASK")}>Add task</button>
            </div>
            <div className="mt-3 space-y-2">
              {tasks.length ? tasks.map((task) => (
                <div key={task.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">{task.title}</p>
                    {task.isDone ? <span className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">Done</span> : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{task.content}</p>
                  {task.dueAt ? <p className="mt-2 text-xs text-slate-500">Due {new Date(task.dueAt).toLocaleString()}</p> : null}
                </div>
              )) : <p className="text-sm text-slate-500">No tasks linked yet.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-semibold text-slate-800">YouTube & external links</p>
            </div>
            <div className="mt-3 space-y-2">
              <input className="input" placeholder="Link title" value={linkTitle} onChange={(event) => setLinkTitle(event.target.value)} />
              <input className="input" placeholder="https://example.com" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} />
              <textarea className="input min-h-20" placeholder="Why this link matters" value={linkDescription} onChange={(event) => setLinkDescription(event.target.value)} />
              <button type="button" className="btn-secondary px-3 py-2 text-sm" disabled={busy} onClick={() => void addArtifact("LINK")}>Save link</button>
            </div>
            <div className="mt-3 space-y-2">
              {links.length ? links.map((link) => (
                <a key={link.id} href={link.source ?? "#"} target="_blank" rel="noreferrer" className="block rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-800">{link.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{link.content}</p>
                  <p className="mt-2 text-xs text-blue-600">{youtubeLinks.includes(link) ? "YouTube · " : "External · "}{link.source}</p>
                </a>
              )) : <p className="text-sm text-slate-500">No links captured yet.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-semibold text-slate-800">Scoped AI chat</p>
            </div>
            <p className="mt-1 text-sm text-slate-500">This chat answers from the selected PDF context only.</p>
            <div className="mt-3 space-y-2">
              <textarea className="input min-h-24" placeholder="Ask about this PDF" value={aiInput} onChange={(event) => setAiInput(event.target.value)} />
              <button type="button" className="btn-primary px-3 py-2 text-sm" disabled={aiBusy} onClick={() => void sendAiMessage()}>Ask AI</button>
            </div>
            <div className="mt-3 space-y-2">
              {chatMessages.length ? chatMessages.map((entry) => (
                <div key={entry.id} className={`rounded-xl border p-3 ${entry.role === "USER" ? "border-blue-100 bg-blue-50" : "border-slate-200 bg-slate-50"}`}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{entry.role}</p>
                  <p className="mt-1 text-sm text-slate-700">{entry.content}</p>
                </div>
              )) : <p className="text-sm text-slate-500">Ask a question to get a grounded answer for this PDF.</p>}
            </div>
          </div>
        </div>
      </div>

      {message ? <p className="mt-4 text-sm text-blue-600">{message}</p> : null}
    </section>
  );
}
