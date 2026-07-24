import {
  createAiProvider,
  isProviderConfigured,
  readRuntimeEnv,
  type AiProviderId,
  type ChatCompletionRequest,
  type ChatCompletionResponse,
} from "@/lib/ai/providers";

export type AiFallbackStatus = "primary" | "fallback" | "retrieval-only";

export type ProviderAttemptLog = {
  provider: AiProviderId;
  model?: string;
  ok: boolean;
  durationMs: number;
  error?: string;
  usage?: ChatCompletionResponse["usage"];
};

export type RoutedChatSuccess = {
  ok: true;
  completion: ChatCompletionResponse;
  fallbackStatus: AiFallbackStatus;
  attempts: ProviderAttemptLog[];
};

export type RoutedChatFailure = {
  ok: false;
  fallbackStatus: "retrieval-only";
  attempts: ProviderAttemptLog[];
  fallbackReason: string;
};

export type RoutedChatResult = RoutedChatSuccess | RoutedChatFailure;

function normalizeProvider(value: string | undefined, fallback: AiProviderId): AiProviderId {
  if (value === "gemini" || value === "groq" || value === "openai" || value === "claude" || value === "ollama") return value;
  return fallback;
}

export function resolveProviderChain(primary?: AiProviderId, fallback?: AiProviderId) {
  const selectedPrimary = primary ?? normalizeProvider(readRuntimeEnv("AI_PROVIDER"), "gemini");
  const selectedFallback = fallback ?? normalizeProvider(readRuntimeEnv("AI_FALLBACK_PROVIDER"), "groq");
  return Array.from(new Set([selectedPrimary, selectedFallback])).filter((provider) => provider === "gemini" || provider === "groq");
}

function logAttempt(event: "selected" | "success" | "fallback", payload: Record<string, unknown>) {
  console.info(`[ai-provider] ${event}`, payload);
}

function modelForProvider(provider: AiProviderId, requestedModel?: string) {
  if (requestedModel) return requestedModel;
  if (provider === "gemini") return readRuntimeEnv("GEMINI_CHAT_MODEL") || "gemini-2.5-flash";
  if (provider === "groq") return readRuntimeEnv("GROQ_CHAT_MODEL") || "llama-3.1-8b-instant";
  return undefined;
}

export async function routeChatCompletion(input: {
  request: ChatCompletionRequest;
  primaryProvider?: AiProviderId;
  fallbackProvider?: AiProviderId;
}) {
  const chain = resolveProviderChain(input.primaryProvider, input.fallbackProvider);
  const attempts: ProviderAttemptLog[] = [];

  console.info("[ai-provider] runtime env", {
    aiProvider: readRuntimeEnv("AI_PROVIDER") || "unset",
    aiFallbackProvider: readRuntimeEnv("AI_FALLBACK_PROVIDER") || "unset",
    geminiKeyPresent: Boolean(readRuntimeEnv("GEMINI_API_KEY") || readRuntimeEnv("GOOGLE_GENERATIVE_AI_API_KEY") || readRuntimeEnv("GOOGLE_AI_API_KEY")),
    groqKeyPresent: Boolean(readRuntimeEnv("GROQ_API_KEY")),
    selectedChain: chain,
  });

  for (const provider of chain) {
    const model = modelForProvider(provider, input.request.model);
    if (!isProviderConfigured(provider)) {
      attempts.push({ provider, model, ok: false, durationMs: 0, error: "provider not configured" });
      logAttempt("fallback", { provider, model, reason: "provider not configured" });
      continue;
    }

    const startedAt = Date.now();
    logAttempt("selected", { provider, model });
    try {
      const completion = await createAiProvider(provider).createChatCompletion({
        ...input.request,
        model,
      });
      const durationMs = Date.now() - startedAt;
      attempts.push({ provider, model: completion.model, ok: true, durationMs, usage: completion.usage });
      logAttempt("success", {
        provider,
        model: completion.model,
        durationMs,
        usage: completion.usage ?? null,
        fallbackStatus: attempts.length === 1 ? "primary" : "fallback",
      });
      return {
        ok: true,
        completion,
        fallbackStatus: attempts.length === 1 ? "primary" : "fallback",
        attempts,
      } satisfies RoutedChatSuccess;
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const message = error instanceof Error ? error.message : "provider error";
      attempts.push({ provider, model, ok: false, durationMs, error: message });
      logAttempt("fallback", { provider, model, durationMs, reason: message });
    }
  }

  return {
    ok: false,
    fallbackStatus: "retrieval-only",
    attempts,
    fallbackReason: attempts.at(-1)?.error || "no provider completed the request",
  } satisfies RoutedChatFailure;
}

