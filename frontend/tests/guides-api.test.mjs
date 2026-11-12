import assert from "node:assert/strict";
import test from "node:test";
import {
  createManagedGuide,
  deleteManagedGuide,
  getManagedGuidePdf,
  listManagedGuides,
  listPublicGuides,
  setManagedGuidePublication,
  updateManagedGuide,
} from "../services/guidesApi.ts";
import { tokenManager } from "../services/tokenManager.ts";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

test("lista guías públicas y de gestión con seis elementos por página", async (t) => {
  tokenManager.setToken(null);
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    calls.push(url);
    return jsonResponse({
      items: [],
      page: 2,
      pageSize: 6,
      total: 7,
      totalPages: 2,
    });
  });

  await listManagedGuides({ page: 2, search: "correo" });
  await listPublicGuides({ page: 1, search: "correo", categoryId: "category-uuid" });

  const managed = new URL(calls[0], "http://localhost");
  assert.equal(managed.pathname, "/api/v1/guides/manage");
  assert.equal(managed.searchParams.get("pageSize"), "6");
  assert.equal(managed.searchParams.get("search"), "correo");
  assert.equal(managed.searchParams.get("order"), "desc");

  const publicList = new URL(calls[1], "http://localhost");
  assert.equal(publicList.pathname, "/api/v1/guides");
  assert.equal(publicList.searchParams.get("pageSize"), "6");
  assert.equal(publicList.searchParams.get("categoryId"), "category-uuid");
});

test("crea y actualiza guías con formularios multipart", async (t) => {
  tokenManager.setToken(null);
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    return jsonResponse({
      id: "guide-uuid",
      title: "Guía",
      category: "Seguridad",
      categoryId: "category-uuid",
      publicationState: "DRAFT",
      file: "guia.pdf",
      fileUrl: "/api/v1/guides/guide-uuid/file",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  const file = new Blob(["%PDF-1.7"], { type: "application/pdf" });
  await createManagedGuide({
    title: "Guía",
    categoryId: "category-uuid",
    file,
  });
  await updateManagedGuide({
    id: "guide-uuid",
    title: "Guía actualizada",
    categoryId: "category-uuid",
  });

  assert.equal(calls[0].options.method, "POST");
  assert.ok(calls[0].options.body instanceof FormData);
  assert.equal(calls[0].options.body.get("title"), "Guía");
  assert.equal(calls[0].options.body.get("categoryId"), "category-uuid");
  assert.equal(calls[0].options.body.get("file").type, "application/pdf");
  assert.equal(calls[1].options.method, "PATCH");
  assert.match(calls[1].url, /\/guides\/guide-uuid$/);
  assert.equal(calls[1].options.body.get("title"), "Guía actualizada");
  assert.equal(calls[1].options.body.has("file"), false);
});

test("publica y elimina guías; obtiene el PDF por la ruta protegida del personal", async (t) => {
  tokenManager.setToken(null);
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    if (options.method === "DELETE") return new Response(null, { status: 204 });
    if (url.endsWith("/file")) {
      return new Response(new Uint8Array([37, 80, 68, 70, 45]), {
        headers: { "Content-Type": "application/pdf" },
      });
    }
    return jsonResponse({ publicationState: "PUBLISHED" });
  });

  await setManagedGuidePublication("guide-uuid", true);
  await deleteManagedGuide("guide-uuid");
  const pdf = await getManagedGuidePdf("guide-uuid");

  assert.equal(calls[0].options.method, "PATCH");
  assert.equal(calls[0].options.body, JSON.stringify({ published: true }));
  assert.equal(calls[1].options.method, "DELETE");
  assert.equal(calls[2].url, "/api/v1/guides/manage/guide-uuid/file");
  assert.equal(pdf.type, "application/pdf");
  assert.deepEqual([...new Uint8Array(await pdf.arrayBuffer())], [37, 80, 68, 70, 45]);
});
