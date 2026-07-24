import test from "node:test";
import assert from "node:assert/strict";

import { routeChatCompletion } from "../../src/lib/ai/provider-router.ts";
import { readRuntimeEnv } from "../../src/lib/ai/providers.ts";

function makeRequest(testScenario) {
  return {
    request: {
      messages: [{ role: "user", content: "Explain how to improve my resume for a frontend role." }],
      temperature: 0.1,
      maxOutputTokens: 256,
      metadata: { testScenario },
    },
  };
}

test("readRuntimeEnv falls back to disk-backed env values when process.env is empty", () => {
  const previous = {
    AI_PROVIDER: process.env.AI_PROVIDER,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
  };

  delete process.env.AI_PROVIDER;
  delete process.env.GEMINI_API_KEY;
  delete process.env.GROQ_API_KEY;

  try {
    assert.equal(readRuntimeEnv("AI_PROVIDER"), "gemini");
    assert.equal(typeof readRuntimeEnv("GEMINI_API_KEY"), "string");
    assert.equal(typeof readRuntimeEnv("GROQ_API_KEY"), "string");
  } finally {
    restoreEnv(previous);
  }
});

test("Gemini success path returns Gemini metadata and primary status", async () => {
  const previous = {
    ALLOW_AI_PROVIDER_TESTING: process.env.ALLOW_AI_PROVIDER_TESTING,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_FALLBACK_PROVIDER: process.env.AI_FALLBACK_PROVIDER,
  };

  process.env.ALLOW_AI_PROVIDER_TESTING = "true";
  process.env.AI_PROVIDER = "gemini";
  process.env.AI_FALLBACK_PROVIDER = "groq";

  try {
    const result = await routeChatCompletion(makeRequest("gemini_success"));

    assert.equal(result.ok, true);
    assert.equal(result.completion.provider, "gemini");
    assert.equal(result.completion.model, "gemini-2.5-flash");
    assert.equal(result.fallbackStatus, "primary");
    assert.equal(result.attempts.length, 1);
    assert.equal(result.attempts[0].provider, "gemini");
  } finally {
    restore(previous);
  }
});

test("Gemini failure falls back to Groq and marks the response as fallback", async () => {
  const previous = {
    ALLOW_AI_PROVIDER_TESTING: process.env.ALLOW_AI_PROVIDER_TESTING,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_FALLBACK_PROVIDER: process.env.AI_FALLBACK_PROVIDER,
  };

  process.env.ALLOW_AI_PROVIDER_TESTING = "true";
  process.env.AI_PROVIDER = "gemini";
  process.env.AI_FALLBACK_PROVIDER = "groq";

  try {
    const result = await routeChatCompletion(makeRequest("gemini_fail_groq_success"));

    assert.equal(result.ok, true);
    assert.equal(result.completion.provider, "groq");
    assert.equal(result.completion.model, "llama-3.1-8b-instant");
    assert.equal(result.fallbackStatus, "fallback");
    assert.equal(result.attempts.length, 2);
    assert.equal(result.attempts[0].provider, "gemini");
    assert.equal(result.attempts[1].provider, "groq");
  } finally {
    restore(previous);
  }
});

test("Gemini and Groq failure falls back to retrieval-only mode", async () => {
  const previous = {
    ALLOW_AI_PROVIDER_TESTING: process.env.ALLOW_AI_PROVIDER_TESTING,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_FALLBACK_PROVIDER: process.env.AI_FALLBACK_PROVIDER,
  };

  process.env.ALLOW_AI_PROVIDER_TESTING = "true";
  process.env.AI_PROVIDER = "gemini";
  process.env.AI_FALLBACK_PROVIDER = "groq";

  try {
    const result = await routeChatCompletion(makeRequest("all_fail"));

    assert.equal(result.ok, false);
    assert.equal(result.fallbackStatus, "retrieval-only");
    assert.equal(result.attempts.length, 2);
    assert.equal(result.attempts[0].provider, "gemini");
    assert.equal(result.attempts[1].provider, "groq");
  } finally {
    restore(previous);
  }
});

function restoreEnv(previous) {
  if (previous.AI_PROVIDER === undefined) {
    delete process.env.AI_PROVIDER;
  } else {
    process.env.AI_PROVIDER = previous.AI_PROVIDER;
  }

  if (previous.GEMINI_API_KEY === undefined) {
    delete process.env.GEMINI_API_KEY;
  } else {
    process.env.GEMINI_API_KEY = previous.GEMINI_API_KEY;
  }

  if (previous.GROQ_API_KEY === undefined) {
    delete process.env.GROQ_API_KEY;
  } else {
    process.env.GROQ_API_KEY = previous.GROQ_API_KEY;
  }
}

function restore(previous) {
  if (previous.ALLOW_AI_PROVIDER_TESTING === undefined) {
    delete process.env.ALLOW_AI_PROVIDER_TESTING;
  } else {
    process.env.ALLOW_AI_PROVIDER_TESTING = previous.ALLOW_AI_PROVIDER_TESTING;
  }

  if (previous.AI_PROVIDER === undefined) {
    delete process.env.AI_PROVIDER;
  } else {
    process.env.AI_PROVIDER = previous.AI_PROVIDER;
  }

  if (previous.AI_FALLBACK_PROVIDER === undefined) {
    delete process.env.AI_FALLBACK_PROVIDER;
  } else {
    process.env.AI_FALLBACK_PROVIDER = previous.AI_FALLBACK_PROVIDER;
  }
}
