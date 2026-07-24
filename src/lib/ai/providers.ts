import fs from "node:fs";
import path from "node:path";

export type AiProviderId = "openai" | "gemini" | "groq" | "claude" | "ollama";

export type EmbeddingRequest = {
  input: string[];
  model?: string;
  dimensions?: number;
};

export type EmbeddingResponse = {
  provider: AiProviderId;
  model: string;
  dimensions: number;
  vectors: number[][];
};

export type ChatMemoryMessage = {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
};

export type ChatCompletionRequest = {
  messages: ChatMemoryMessage[];
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  metadata?: Record<string, unknown>;
};

export type ChatCompletionResponse = {
  provider: AiProviderId;
  model: string;
  content: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};

export interface AiModelProvider {
  id: AiProviderId;
  createEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse>;
  createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
}

class NotConfiguredProvider implements AiModelProvider {
  constructor(public readonly id: AiProviderId) {}

  async createEmbedding(): Promise<EmbeddingResponse> {
    throw new Error(`${this.id} embedding provider is not configured.`);
  }

  async createChatCompletion(): Promise<ChatCompletionResponse> {
    throw new Error(`${this.id} chat provider is not configured.`);
  }
}

function parseEnvFile(content: string) {
  const values: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    values[match[1]] = value;
  }

  return values;
}

export function readRuntimeEnv(name: string) {
  const direct = process.env[name];
  if (typeof direct === "string" && direct.trim().length > 0) {
    return direct;
  }

  const candidates = [path.join(process.cwd(), ".env.local"), path.join(process.cwd(), ".env")];

  for (const candidate of candidates) {
    try {
      const content = fs.readFileSync(candidate, "utf8");
      const values = parseEnvFile(content);
      if (typeof values[name] === "string" && values[name].trim().length > 0) {
        return values[name];
      }
    } catch {
      // Continue to the next candidate if the file is not available.
    }
  }

  if (name === "AI_PROVIDER") return "gemini";

  return "";
}

function maybeMockCompletion(provider: AiProviderId, request: ChatCompletionRequest) {
  if (process.env.ALLOW_AI_PROVIDER_TESTING !== "true") return null;
  const scenario = String(request.metadata?.testScenario ?? "");
  if (!scenario) return null;

  if (scenario === "gemini_success" && provider === "gemini") {
    return {
      provider,
      model: request.model || "gemini-2.5-flash",
      content: "Mock Gemini career answer grounded in retrieved context [1].",
      usage: { inputTokens: 10, outputTokens: 12 },
    } satisfies ChatCompletionResponse;
  }

  if (scenario === "gemini_fail_groq_success") {
    if (provider === "gemini") throw new Error("Mock Gemini provider error.");
    if (provider === "groq") {
      return {
        provider,
        model: request.model || "llama-3.1-8b-instant",
        content: "Mock Groq fallback career answer grounded in retrieved context [1].",
        usage: { inputTokens: 11, outputTokens: 13 },
      } satisfies ChatCompletionResponse;
    }
  }

  if (scenario === "all_fail" && (provider === "gemini" || provider === "groq")) {
    throw new Error(`Mock ${provider} provider error.`);
  }

  return null;
}

function readGeminiKey() {
  return (
    readRuntimeEnv("GEMINI_API_KEY") ||
    readRuntimeEnv("GOOGLE_GENERATIVE_AI_API_KEY") ||
    readRuntimeEnv("GOOGLE_AI_API_KEY") ||
    ""
  );
}

function readGroqKey() {
  return readRuntimeEnv("GROQ_API_KEY") || "";
}

function mapGeminiRole(role: ChatMemoryMessage["role"]) {
  return role === "assistant" ? "model" : "user";
}

class GeminiProvider implements AiModelProvider {
  readonly id = "gemini" as const;

  async createEmbedding(): Promise<EmbeddingResponse> {
    throw new Error("Gemini embeddings are not configured for this deployment.");
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const mock = maybeMockCompletion(this.id, request);
    if (mock) return mock;

    const key = readGeminiKey();
    if (!key) throw new Error("Gemini chat provider is not configured.");

    const model = request.model || readRuntimeEnv("GEMINI_CHAT_MODEL") || "gemini-2.5-flash";
    const systemMessages = request.messages.filter((message) => message.role === "system");
    const conversationMessages = request.messages.filter((message) => message.role !== "system" && message.role !== "tool");
    const toolMessages = request.messages.filter((message) => message.role === "tool");
    const systemText = [...systemMessages, ...toolMessages].map((message) => message.content).join("\n\n");

    console.info("[ai-provider] gemini request", {
      model,
      keyPresent: Boolean(key),
      messageCount: conversationMessages.length,
      systemTextLength: systemText.length,
    });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: systemText ? { parts: [{ text: systemText }] } : undefined,
        contents: conversationMessages.map((message) => ({
          role: mapGeminiRole(message.role),
          parts: [{ text: message.content }],
        })),
        generationConfig: {
          temperature: request.temperature ?? 0.2,
          maxOutputTokens: request.maxOutputTokens ?? 900,
        },
      }),
    });

    const json = await response.json().catch(() => null);
    console.info("[ai-provider] gemini result", {
      status: response.status,
      ok: response.ok,
      usage: json?.usageMetadata ?? null,
      candidateCount: json?.candidates?.length ?? 0,
      error: json?.error ?? null,
    });
    if (!response.ok) {
      const detail = json?.error?.message || `Gemini request failed with status ${response.status}.`;
      throw new Error(detail);
    }

    const content = json?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .join("")
      .trim();

    if (!content) throw new Error("Gemini returned an empty response.");

    return {
      provider: this.id,
      model,
      content,
      usage: {
        inputTokens: json?.usageMetadata?.promptTokenCount,
        outputTokens: json?.usageMetadata?.candidatesTokenCount,
      },
    };
  }
}

function toGroqMessages(messages: ChatMemoryMessage[]) {
  const systemText = messages
    .filter((message) => message.role === "system" || message.role === "tool")
    .map((message) => message.content)
    .join("\n\n");
  const conversation = messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({ role: message.role, content: message.content }));
  return systemText ? [{ role: "system", content: systemText }, ...conversation] : conversation;
}

class GroqProvider implements AiModelProvider {
  readonly id = "groq" as const;

  async createEmbedding(): Promise<EmbeddingResponse> {
    throw new Error("Groq embeddings are not configured for this deployment.");
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const mock = maybeMockCompletion(this.id, request);
    if (mock) return mock;

    const key = readGroqKey();
    if (!key) throw new Error("Groq chat provider is not configured.");

    const model = request.model || readRuntimeEnv("GROQ_CHAT_MODEL") || "llama-3.1-8b-instant";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(readRuntimeEnv("AI_PROVIDER_TIMEOUT_MS") || 25_000));

    console.info("[ai-provider] groq request", {
      model,
      keyPresent: Boolean(key),
      messageCount: toGroqMessages(request.messages).length,
    });

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages: toGroqMessages(request.messages),
          temperature: request.temperature ?? 0.2,
          max_tokens: request.maxOutputTokens ?? 900,
        }),
      });

      const json = await response.json().catch(() => null);
      console.info("[ai-provider] groq result", {
        status: response.status,
        ok: response.ok,
        usage: json?.usage ?? null,
        choices: json?.choices?.length ?? 0,
        error: json?.error ?? null,
      });
      if (!response.ok) {
        const detail = json?.error?.message || `Groq request failed with status ${response.status}.`;
        throw new Error(detail);
      }

      const content = String(json?.choices?.[0]?.message?.content || "").trim();
      if (!content) throw new Error("Groq returned an empty response.");

      return {
        provider: this.id,
        model,
        content,
        usage: {
          inputTokens: json?.usage?.prompt_tokens,
          outputTokens: json?.usage?.completion_tokens,
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function createAiProvider(provider: AiProviderId): AiModelProvider {
  if (provider === "gemini") return new GeminiProvider();
  if (provider === "groq") return new GroqProvider();
  return new NotConfiguredProvider(provider);
}

export function isProviderConfigured(provider: AiProviderId) {
  const testingMode = process.env.ALLOW_AI_PROVIDER_TESTING === "true";

  if (provider === "gemini") {
    return testingMode || Boolean(readGeminiKey());
  }

  if (provider === "groq") {
    return testingMode || Boolean(readGroqKey());
  }

  return false;
}

export const supportedAiProviders: AiProviderId[] = ["openai", "gemini", "groq", "claude", "ollama"];
