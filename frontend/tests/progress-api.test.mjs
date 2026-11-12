import assert from "node:assert/strict";
import test from "node:test";
import {
  getMyProgress,
  markGuideRead,
  markLessonCompleted,
} from "../services/progressApi.ts";

test("consulta y registra el progreso con las rutas autenticadas esperadas", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (input, init) => {
    requests.push({
      url: String(input),
      method: init?.method ?? "GET",
    });
    if (init?.method === "POST") return new Response(null, { status: 204 });
    return Response.json({
      guides: { completed: 1, total: 2, percentage: 50 },
      lessons: { completed: 2, total: 4, percentage: 50 },
    });
  };

  try {
    assert.deepEqual(await getMyProgress(), {
      guides: { completed: 1, total: 2, percentage: 50 },
      lessons: { completed: 2, total: 4, percentage: 50 },
    });
    await markGuideRead("guide-id");
    await markLessonCompleted("lesson-id");

    assert.deepEqual(
      requests.map(({ url, method }) => ({
        path: new URL(url, "http://localhost").pathname,
        method,
      })),
      [
        { path: "/api/v1/progress/me", method: "GET" },
        { path: "/api/v1/progress/guides/guide-id/read", method: "POST" },
        {
          path: "/api/v1/progress/lessons/lesson-id/complete",
          method: "POST",
        },
      ],
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
