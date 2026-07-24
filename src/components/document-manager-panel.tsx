"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, FileText, FileUp, FolderPlus, PencilLine, Search, Trash2, Upload, X } from "lucide-react";
import { authHeaders } from "@/lib/firebase-client";

type Folder = { id: string; name: string; color: string | null; _count?: { documents: number; children: number } };
type CareerDocument = {
  id: string;
  name: string;
  type: string;
  status: string;
  category: string | null;
  tags: string[];
  isFavorite: boolean;
  uploadedAt: string;
  sizeBytes: number;
  folder: { id: string; name: string; color: string | null } | null;
};

export function DocumentManagerPanel() {
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<CareerDocument[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [folderId, setFolderId] = useState("");
  const [folderName, setFolderName] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState("PDF");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [previewDoc, setPreviewDoc] = useState<CareerDocument | null>(null);

  const load = useCallback(async () => {
    const headers = await authHeaders();
    if (!headers.Authorization) return;

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (type !== "all") params.set("type", type);
    if (folderId) params.set("folderId", folderId);

    const [folderRes, docRes] = await Promise.all([
      fetch("/api/documents/folders", { headers }),
      fetch(`/api/documents?${params.toString()}`, { headers }),
    ]);
    const folderJson = await folderRes.json().catch(() => null);
    const docJson = await docRes.json().catch(() => null);
    if (folderRes.ok) setFolders(folderJson.folders ?? []);
    if (docRes.ok) setDocuments(docJson.documents ?? []);
  }, [folderId, query, type]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void load();
    });
    return () => cancelAnimationFrame(id);
  }, [load]);

  async function createFolder() {
    const headers = await authHeaders();
    if (!headers.Authorization || !folderName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/documents/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ name: folderName.trim(), color: "#2563eb" }),
      });
      setMessage(res.ok ? "Folder created." : "Unable to create folder.");
      setFolderName("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function uploadDocument() {
    const headers = await authHeaders();
    if (!headers.Authorization || !uploadFile) return;
    setBusy(true);
    try {
      const body = new FormData();
      body.set("file", uploadFile);
      body.set("name", uploadFile.name);
      body.set("type", uploadType);
      body.set("tags", tags);
      if (folderId) body.set("folderId", folderId);

      const res = await fetch("/api/documents", {
        method: "POST",
        headers,
        body,
      });
      setMessage(res.ok ? "Document uploaded." : "Unable to upload document.");
      setUploadFile(null);
      setTags("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function renameDocument(documentId: string, name: string) {
    const headers = await authHeaders();
    if (!headers.Authorization || !name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ name: name.trim() }),
      });
      setMessage(res.ok ? "Document renamed." : "Unable to rename document.");
      setEditingId(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function moveDocument(documentId: string, nextFolder: string) {
    const headers = await authHeaders();
    if (!headers.Authorization) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ folderId: nextFolder || null }),
      });
      setMessage(res.ok ? "Document moved." : "Unable to move document.");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function deleteDocument(documentId: string) {
    const headers = await authHeaders();
    if (!headers.Authorization) return;
    const confirmed = window.confirm("Delete this document permanently?");
    if (!confirmed) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
        headers,
      });
      setMessage(res.ok ? "Document deleted." : "Unable to delete document.");
      await load();
    } finally {
      setBusy(false);
    }
  }

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    setUploadFile(event.target.files?.[0] ?? null);
  }

  function startRename(document: CareerDocument) {
    setEditingId(document.id);
    setRenameValue(document.name);
  }

  function previewDocument(document: CareerDocument) {
    setPreviewDoc(document);
  }

  function closePreview() {
    setPreviewDoc(null);
  }

  return (
    <section className="panel shell-frame p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Documents</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Upload, search, rename, and organize your PDFs.</h2>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600">
          {documents.length} saved
        </span>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Upload className="h-4 w-4 text-blue-600" /> Upload a file
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
            <input className="input" type="file" accept=".pdf" onChange={onFile} />
            <select className="input md:w-40" value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
              <option value="PDF">PDF</option>
              <option value="RESUME">Resume</option>
              <option value="NOTE">Note</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <input className="input mt-2" placeholder="Tags, comma separated" value={tags} onChange={(e) => setTags(e.target.value)} />
          <button className="btn-primary mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm" disabled={busy || !uploadFile} onClick={() => void uploadDocument()}>
            <FileUp className="h-4 w-4" /> Upload document
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <FolderPlus className="h-4 w-4 text-blue-600" /> Organize by folder
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
            <input className="input" placeholder="New folder name" value={folderName} onChange={(e) => setFolderName(e.target.value)} />
            <button className="btn-secondary px-4 py-2 text-sm" disabled={busy || !folderName.trim()} onClick={() => void createFolder()}>
              Create
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className={`rounded-full border px-3 py-1.5 text-xs ${!folderId ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600"}`} onClick={() => setFolderId("")}>
              All files
            </button>
            {folders.map((folder) => (
              <button key={folder.id} className={`rounded-full border px-3 py-1.5 text-xs ${folderId === folder.id ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600"}`} onClick={() => setFolderId(folder.id)}>
                {folder.name} ({folder._count?.documents ?? 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-2 md:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search documents" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="input md:w-44" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">All types</option>
          <option value="PDF">PDF</option>
          <option value="RESUME">Resume</option>
          <option value="NOTE">Notes</option>
          <option value="OTHER">Other</option>
        </select>
        <button className="btn-secondary px-4 py-2 text-sm" onClick={() => void load()}>
          Refresh
        </button>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        {documents.map((document) => (
          <div key={document.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                {editingId === document.id ? (
                  <input className="input py-2" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
                ) : (
                  <p className="text-sm font-semibold text-slate-800">{document.name}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">{document.type} • {new Date(document.uploadedAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" onClick={() => previewDocument(document)}>
                  <Eye className="h-4 w-4" />
                </button>
                <button type="button" className="rounded-full border border-blue-200 bg-blue-50 p-2 text-blue-700 hover:bg-blue-100" onClick={() => router.push(`/documents/${document.id}`)}>
                  <FileText className="h-4 w-4" />
                </button>
                <button type="button" className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" onClick={() => startRename(document)}>
                  <PencilLine className="h-4 w-4" />
                </button>
                <button type="button" className="rounded-full border border-rose-200 p-2 text-rose-600 hover:bg-rose-50" onClick={() => void deleteDocument(document.id)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">{Math.max(1, Math.round(document.sizeBytes / 1024))} KB</span>
              {document.folder ? <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] text-blue-700">{document.folder.name}</span> : null}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="text-xs font-medium text-slate-500">Move to</label>
              <select className="input py-2 text-sm" value={document.folder?.id ?? ""} onChange={(e) => void moveDocument(document.id, e.target.value)}>
                <option value="">No folder</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
              </select>
            </div>

            {editingId === document.id ? (
              <div className="mt-3 flex gap-2">
                <button type="button" className="btn-primary px-3 py-2 text-sm" disabled={busy || !renameValue.trim()} onClick={() => void renameDocument(document.id, renameValue)}>
                  Save
                </button>
                <button type="button" className="btn-secondary px-3 py-2 text-sm" onClick={() => { setEditingId(null); setRenameValue(""); }}>
                  Cancel
                </button>
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-1.5">
              {document.tags.slice(0, 5).map((tag) => (
                <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}

        {documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center xl:col-span-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">No documents yet</p>
            <p className="mt-1 text-sm text-slate-500">Upload a PDF and it will stay available after you sign out and back in.</p>
          </div>
        ) : null}
      </div>

      {previewDoc ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-5xl rounded-2xl bg-white p-3 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">{previewDoc.name}</p>
                <p className="text-xs text-slate-500">{previewDoc.type}</p>
              </div>
              <button type="button" className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" onClick={closePreview}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {previewDoc.name.toLowerCase().endsWith(".pdf") || previewDoc.type === "PDF" ? (
                <iframe src={`/api/documents/${previewDoc.id}/download`} title={previewDoc.name} className="h-[70vh] w-full" />
              ) : (
                <div className="flex h-[70vh] items-center justify-center p-6 text-center">
                  <a href={`/api/documents/${previewDoc.id}/download`} target="_blank" rel="noreferrer" className="btn-primary px-4 py-2 text-sm">
                    Open file in a new tab
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {message ? <p className="mt-4 text-sm text-blue-600">{message}</p> : null}
    </section>
  );
}
