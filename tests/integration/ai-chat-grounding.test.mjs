import test from "node:test";
import assert from "node:assert/strict";
import { buildRetrievalAnswer, buildStoredContextNotFoundReply } from "../../src/lib/ai/retrieval.ts";

test("returns a not-found response when no stored context is available", () => {
  const question = "What is the candidate's target role?";
  const reply = buildRetrievalAnswer(question, []);

  assert.equal(reply, buildStoredContextNotFoundReply(question));
  assert.match(reply, /could not find information/i);
  assert.match(reply, /uploaded PDFs|notes|resume|career profile|stored links/i);
});
