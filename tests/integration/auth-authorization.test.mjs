import test from "node:test";
import assert from "node:assert/strict";

import { NextRequest } from "next/server";
import { middleware } from "../../middleware.ts";
import { getAuthContext } from "../../src/lib/auth-server.ts";

function makeRequest(pathname) {
  return new NextRequest(new URL(`http://localhost${pathname}`));
}

test("middleware redirects protected document routes to login", async () => {
  const response = await middleware(makeRequest("/documents"));

  assert.equal(response.status, 307);
  assert.match(response.headers.get("location") || "", /\/auth\?next=%2Fdocuments$/);
});

test("middleware also protects roadmap and skill routes", async () => {
  const roadmapResponse = await middleware(makeRequest("/roadmaps"));
  const skillsResponse = await middleware(makeRequest("/skills"));

  assert.equal(roadmapResponse.status, 307);
  assert.equal(skillsResponse.status, 307);
});

test("server auth validation rejects placeholder fallback access", async () => {
  const previous = process.env.ALLOW_DEMO_AUTH;
  delete process.env.ALLOW_DEMO_AUTH;

  try {
    const auth = await getAuthContext(makeRequest("/profile"));
    assert.equal(auth, null);
  } finally {
    if (previous === undefined) delete process.env.ALLOW_DEMO_AUTH;
    else process.env.ALLOW_DEMO_AUTH = previous;
  }
});
