"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Bot, MessageSquare, Send, Sparkles } from "lucide-react";
import { authHeaders as getAuthHeaders } from "@/lib/firebase-client";

type Conversation = { id: string; title: string | null; _count?: { messages: number } };
type Message = {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM" | "TOOL";
  content: string;
  citations?: unknown;
  metadata?: {
    provider?: string | null;
    model?: string | null;
    fallbackStatus?: string | null;
    mode?: string | null;
    usage?: { inputTokens?: number; outputTokens?: number } | null;
  };
};
type Citation = { documentId: string; chunkId: string | null; documentName: string; score: number };

export function AiChatPanel() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const authHeaders = useCallback(async (): Promise<Record<string, string>> => {
    return getAuthHeaders();
  }, []);

  const loadConversations = useCallback(async () => {
    const headers = await authHeaders();
    const res = await fetch("/api/ai/conversations", { headers });
    const json = await res.json().catch(() => null);
    if (res.ok) setConversations(json.conversations ?? []);
  }, [authHeaders]);

  const loadMessages = useCallback(async (id: string) => {
    const headers = await authHeaders();
    const res = await fetch(`/api/ai/conversations/${id}/messages`, { headers });
    const json = await res.json().catch(() => null);
    if (res.ok) setMessages(json.messages ?? []);
  }, [authHeaders]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void loadConversations();
    });
    return () => cancelAnimationFrame(id);
  }, [loadConversations]);

  const sendMessage = useCallback(async () => {
    if (!input.trim()) return;
    const headers = await authHeaders();
    setBusy(true);
    setNotice("");
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          message: input.trim(),
          ...(conversationId ? { conversationId } : {}),
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const detail = typeof json?.error === "string" ? json.error : json?.error?.message ?? json?.error?.formErrors?.[0] ?? "Unable to send message.";
        setNotice(detail);
        return;
      }
      setInput("");
      setConversationId(json.conversationId);
      await Promise.all([loadConversations(), loadMessages(json.conversationId)]);
    } finally {
      setBusy(false);
    }
  }, [authHeaders, conversationId, input, loadConversations, loadMessages]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await sendMessage();
    },
    [sendMessage],
  );

  function citationsFor(message: Message): Citation[] {
    return Array.isArray(message.citations) ? (message.citations as Citation[]) : [];
  }

  function providerBadge(message: Message) {
    const provider = message.metadata?.provider ?? "retrieval";
    const fallbackStatus = message.metadata?.fallbackStatus ?? "retrieval-only";

    if (provider === "gemini") {
      return { label: "Gemini", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }

    if (provider === "groq") {
      return { label: fallbackStatus === "fallback" ? "Groq fallback" : "Groq", tone: "bg-amber-50 text-amber-700 border-amber-200" };
    }

    return { label: "Retrieval", tone: "bg-slate-100 text-slate-700 border-slate-200" };
  }

  return (
    <section className="panel shell-frame p-5">
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="soft-card p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="sub-title"><MessageSquare className="h-3.5 w-3.5" /> Conversations</p>
            <button
              className="btn-secondary px-3 py-1.5 text-xs"
              onClick={() => {
                setConversationId(null);
                setMessages([]);
              }}
            >
              New
            </button>
          </div>
          <div className="mt-4 grid gap-2">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                className={`module-shortcut-card text-left ${conversationId === conversation.id ? "ring-1 ring-cyan-300/60" : ""}`}
                onClick={() => {
                  setConversationId(conversation.id);
                  void loadMessages(conversation.id);
                }}
              >
                <p className="truncate text-sm font-semibold text-slate-700">{conversation.title ?? "Career chat"}</p>
                <p className="text-xs text-slate-500">{conversation._count?.messages ?? 0} messages</p>
              </button>
            ))}
            {conversations.length === 0 ? <p className="text-sm text-slate-500">No conversations yet.</p> : null}
          </div>
        </aside>

        <div className="soft-card flex min-h-[560px] flex-col p-4">
          <div className="flex items-center gap-2 border-b border-slate-200/70 pb-3">
            <span className="icon-badge h-9 w-9"><Bot className="h-4 w-4" /></span>
            <div>
              <p className="text-sm font-semibold text-slate-700">StudyOrbit Assistant</p>
              <p className="text-xs text-slate-500">RAG career guidance with document citations.</p>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-auto py-4">
            {messages.map((message) => {
              const badge = providerBadge(message);
              return (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-xl p-3 ${message.role === "USER" ? "ml-auto bg-indigo-50 text-slate-700" : "bg-white/80 text-slate-700"}`}
                >
                  {message.role === "ASSISTANT" ? (
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.25em]">
                      <span className={`inline-flex items-center rounded-full border px-2 py-1 ${badge.tone}`}>{badge.label}</span>
                      {message.metadata?.model ? <span className="chip">{message.metadata.model}</span> : null}
                      {message.metadata?.fallbackStatus && message.metadata.fallbackStatus !== "primary" ? (
                        <span className="chip">{message.metadata.fallbackStatus}</span>
                      ) : null}
                    </div>
                  ) : null}
                  <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                  {citationsFor(message).length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {citationsFor(message).map((citation) => (
                        <span key={`${citation.documentId}-${citation.chunkId}`} className="chip text-[10px]">
                          {citation.documentName} ({Math.round(citation.score * 100)}%)
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-illustration"><Sparkles className="h-6 w-6" /></div>
                <p className="text-sm font-semibold text-slate-700">Ask a career question</p>
                <p className="mt-1 text-xs text-slate-500">Try resume, roadmap, interview, certification, or skill-gap questions.</p>
              </div>
            ) : null}
          </div>

          <form className="grid gap-2 border-t border-slate-200/70 pt-3 md:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
            <input
              className="input"
              placeholder="Ask about resume, interview prep, skills, or a career roadmap..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm"
              disabled={busy || !input.trim()}
            >
              <Send className="h-4 w-4" /> Send
            </button>
          </form>
          {notice ? <p className="mt-2 text-xs text-rose-500">{notice}</p> : null}
        </div>
      </div>
    </section>
  );
}
