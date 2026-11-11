import assert from "node:assert/strict";
import test from "node:test";
import {
  createCategory,
  deleteCategory,
  listCategories,
  renameCategory,
} from "../services/categoriesApi.ts";
import { tokenManager } from "../services/tokenManager.ts";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

test("obtiene todas las páginas del endpoint de categorías", async (t) => {
  tokenManager.setToken(null);
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    const page = new URL(url, "http://localhost").searchParams.get("page");
    return jsonResponse({
      items: [{ id: `category-${page}`, title: `Categoría ${page}` }],
      page: Number(page),
      pageSize: 100,
      total: 2,
      totalPages: 2,
    });
  });

  assert.deepEqual(await listCategories(), [
    { id: "category-1", title: "Categoría 1" },
    { id: "category-2", title: "Categoría 2" },
  ]);
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /\/categories\?page=1&pageSize=100$/);
  assert.match(calls[1].url, /\/categories\?page=2&pageSize=100$/);
});

test("crea, renombra y elimina categorías con los verbos y cuerpos esperados", async (t) => {
  tokenManager.setToken(null);
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    if (options.method === "DELETE") return new Response(null, { status: 204 });
    return jsonResponse({ id: "a-uuid", title: "Categoría" });
  });

  assert.deepEqual(await createCategory("Categoría"), {
    id: "a-uuid",
    title: "Categoría",
  });
  assert.deepEqual(await renameCategory("a-uuid", "Categoría"), {
    id: "a-uuid",
    title: "Categoría",
  });
  await deleteCategory("a-uuid");

  assert.equal(calls[0].options.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].options.body), { title: "Categoría" });
  assert.equal(calls[1].options.method, "PATCH");
  assert.match(calls[1].url, /\/categories\/a-uuid$/);
  assert.equal(calls[2].options.method, "DELETE");
  assert.match(calls[2].url, /\/categories\/a-uuid$/);
});

test("muestra en español los errores de categoría que devuelve el servidor", async (t) => {
  tokenManager.setToken(null);
  t.mock.method(globalThis, "fetch", async () =>
    jsonResponse(
      { message: "A category with that name already exists" },
      409,
    ),
  );

  await assert.rejects(createCategory("Categoría duplicada"), {
    message: "Ya existe una categoría con ese nombre.",
  });
});
