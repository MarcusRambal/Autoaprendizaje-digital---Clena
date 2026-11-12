import assert from "node:assert/strict";
import test from "node:test";
import { getStatistics, trackGuideView } from "../services/statsApi.ts";
import { tokenManager } from "../services/tokenManager.ts";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

test("consulta estadísticas con el rango de fechas como query params", async (t) => {
  tokenManager.setToken(null);
  let requestUrl = "";
  t.mock.method(globalThis, "fetch", async (url) => {
    requestUrl = url;
    return jsonResponse({
      range: { from: "2026-11-01", to: "2026-11-12" },
      topGuides: [],
      topCategories: [],
      helpRequests: { total: 0, attended: 0 },
    });
  });

  const result = await getStatistics({
    from: "2026-11-01",
    to: "2026-11-12",
  });

  const query = new URL(requestUrl, "http://localhost").searchParams;
  assert.equal(requestUrl, "/api/v1/stats?from=2026-11-01&to=2026-11-12");
  assert.equal(query.get("from"), "2026-11-01");
  assert.equal(query.get("to"), "2026-11-12");
  assert.deepEqual(result.helpRequests, { total: 0, attended: 0 });
});

test("registra una vista pública con POST /guides/:id/view", async (t) => {
  tokenManager.setToken(null);
  let request;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    request = { url, options };
    return new Response(null, { status: 204 });
  });

  await trackGuideView("guide-uuid");

  assert.equal(request.url, "/api/v1/guides/guide-uuid/view");
  assert.equal(request.options.method, "POST");
});
