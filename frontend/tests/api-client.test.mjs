import assert from "node:assert/strict";
import test from "node:test";
import { apiClient } from "../services/apiClient.ts";
import { AuthError } from "../services/authApi.ts";
import { tokenManager } from "../services/tokenManager.ts";

const refreshedSession = {
  accessToken: "refreshed-access-token",
  user: { id: "1", email: "student@example.test", role: "PUBLIC_USER" },
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function resetTokenManager() {
  tokenManager.setToken(null);
  tokenManager.setUnauthorizedHandler(() => {});
}

test("adds the access token, refreshes after 401, and retries with the new token", async (t) => {
  resetTokenManager();
  tokenManager.setToken("expired-access-token");
  const calls = [];

  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    if (url === "/api/v1/auth/refresh") {
      return jsonResponse(refreshedSession);
    }

    const headers = new Headers(options.headers);
    if (headers.get("Authorization") === "Bearer expired-access-token") {
      return jsonResponse({ message: "Unauthorized" }, 401);
    }
    return jsonResponse({ result: "ok" });
  });

  assert.deepEqual(await apiClient("/resource"), { result: "ok" });
  assert.equal(calls.length, 3);
  assert.equal(calls[0].url, "/api/v1/resource");
  assert.equal(
    new Headers(calls[0].options.headers).get("Authorization"),
    "Bearer expired-access-token",
  );
  assert.equal(calls[0].options.credentials, "include");
  assert.equal(calls[1].options.credentials, "include");
  assert.equal(
    new Headers(calls[2].options.headers).get("Authorization"),
    "Bearer refreshed-access-token",
  );
  assert.equal(tokenManager.getToken(), "refreshed-access-token");
});

test("shares one refresh promise between concurrent 401 responses", async (t) => {
  resetTokenManager();
  tokenManager.setToken("expired-access-token");

  let refreshCount = 0;
  let resolveRefresh;
  const pendingRefreshResponse = new Promise((resolve) => {
    resolveRefresh = resolve;
  });

  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url === "/api/v1/auth/refresh") {
      refreshCount += 1;
      return pendingRefreshResponse;
    }
    if (
      new Headers(options.headers).get("Authorization") ===
      "Bearer refreshed-access-token"
    ) {
      return jsonResponse({ result: url });
    }
    return jsonResponse({ message: "Unauthorized" }, 401);
  });

  const firstRequest = apiClient("/first");
  const secondRequest = apiClient("/second");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(refreshCount, 1);

  resolveRefresh(jsonResponse(refreshedSession));
  assert.deepEqual(await Promise.all([firstRequest, secondRequest]), [
    { result: "/api/v1/first" },
    { result: "/api/v1/second" },
  ]);
});

test("clears the token and notifies the unauthorized handler when refresh fails", async (t) => {
  resetTokenManager();
  tokenManager.setToken("expired-access-token");
  let unauthorizedCount = 0;
  tokenManager.setUnauthorizedHandler(() => {
    unauthorizedCount += 1;
  });

  t.mock.method(globalThis, "fetch", async () =>
    jsonResponse({ message: "Unauthorized" }, 401),
  );

  await assert.rejects(apiClient("/private"), (error) => {
    return error instanceof AuthError && error.status === 401;
  });
  assert.equal(tokenManager.getToken(), null);
  assert.equal(unauthorizedCount, 1);
});

test("returns undefined for a successful 204 response", async (t) => {
  resetTokenManager();
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response(null, { status: 204 }),
  );

  assert.equal(await apiClient("/resource", { method: "DELETE" }), undefined);
});
