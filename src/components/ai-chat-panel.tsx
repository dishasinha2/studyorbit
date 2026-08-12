"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Bot, MessageSquare, Send, Sparkles, Menu } from "lucide-react";
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
  const [showConversationActions, setShowConversationActions] = useState(false);

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
    <section className="panel shell-frame p-3 sm:p-4">
      <div className="relative overflow-hidden rounded-[26px] border border-slate-200/70 bg-slate-50/80">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/60 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Toggle chat history"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              onClick={() => setShowConversationActions((value) => !value)}
            >
              <div className="flex flex-col gap-1.5">
                <span className="block h-0.5 w-4 rounded-full bg-slate-700" />
                <span className="block h-0.5 w-4 rounded-full bg-slate-700" />
                <span className="block h-0.5 w-4 rounded-full bg-slate-700" />
              </div>
            </button>
            <p className="text-base font-semibold text-slate-800">AI guidance</p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            onClick={() => {
              setConversationId(null);
              setMessages([]);
              setShowConversationActions(false);
            }}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            New Chat
          </button>
        </div>

        {showConversationActions ? (
          <div className="absolute left-4 top-[72px] z-20 w-[260px] rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-sm">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
              onClick={() => {
                void loadConversations();
                setShowConversationActions(false);
              }}
            >
              <span>History</span>
              <MessageSquare className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="mt-2 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
              onClick={() => {
                setConversationId(null);
                setMessages([]);
                setShowConversationActions(false);
              }}
            >
              <span>New Chat</span>
              <Bot className="h-4 w-4" />
            </button>

            <div className="mt-4 space-y-2 border-t border-slate-200 pt-3">
              {conversations.length ? (
                conversations.slice(0, 5).map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    className={`block w-full rounded-xl border px-3 py-2 text-left transition ${conversationId === conversation.id ? "border-cyan-200 bg-cyan-50 text-slate-800" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}
                    onClick={() => {
                      setConversationId(conversation.id);
                      void loadMessages(conversation.id);
                      setShowConversationActions(false);
                    }}
                  >
                    <p className="truncate text-sm font-medium">{conversation.title ?? "Career chat"}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{conversation._count?.messages ?? 0} messages</p>
                  </button>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">No conversations yet.</p>
              )}
            </div>
          </div>
        ) : null}

        <div className="flex min-h-[620px] flex-col gap-4 bg-white/50 p-4 sm:p-5">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-sm">
              <Bot className="h-5 w-5" />
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">StudyOrbit</span>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-[24px] border border-slate-200/80 bg-slate-50/70 p-3 sm:p-4">
            {messages.map((message) => {
              const badge = providerBadge(message);
              return (
                <div
                  key={message.id}
                  className={`max-w-[88%] rounded-[24px] p-4 ${message.role === "USER" ? "ml-auto bg-gradient-to-br from-violet-600 to-indigo-600 text-white" : "border border-slate-200 bg-white text-slate-700 shadow-sm"}`}
                >
                  {message.role === "ASSISTANT" ? (
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-500">
                      <span className={`inline-flex items-center rounded-full border px-2 py-1 ${badge.tone}`}>{badge.label}</span>
                      {message.metadata?.model ? <span className="chip">{message.metadata.model}</span> : null}
                      {message.metadata?.fallbackStatus && message.metadata.fallbackStatus !== "primary" ? (
                        <span className="chip">{message.metadata.fallbackStatus}</span>
                      ) : null}
                    </div>
                  ) : null}
                  <p className="whitespace-pre-wrap text-sm leading-7">{message.content}</p>
                  {citationsFor(message).length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
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
              <div className="flex h-full min-h-[320px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-white/70 p-6 text-center">
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-base font-semibold text-slate-800">Ask a career question</p>
                  <p className="mt-2 text-sm text-slate-500">Try resume, roadmap, interview, certification, or skill-gap questions.</p>
                </div>
              </div>
            ) : null}
          </div>

          <form className="grid gap-3 border-t border-slate-200/80 pt-4 md:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
            <input
              className="input w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400"
              placeholder="Ask about resume, interview prep, skills, or a career roadmap..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="btn-primary inline-flex items-center justify-center gap-2 rounded-[18px] px-5 py-3 text-sm"
              disabled={busy || !input.trim()}
            >
              <Send className="h-4 w-4" /> Send
            </button>
          </form>

          {notice ? <p className="text-xs text-rose-500">{notice}</p> : null}
        </div>
      </div>
    </section>
  );
}
