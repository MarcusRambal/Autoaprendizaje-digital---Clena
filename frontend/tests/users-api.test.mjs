import assert from "node:assert/strict";
import test from "node:test";
import {
  createUser,
  deleteMyAccount,
  deleteUserAccount,
  listUserAccounts,
  USER_PAGE_SIZE,
} from "../services/usersApi.ts";
import { AuthError } from "../services/authApi.ts";
import { tokenManager } from "../services/tokenManager.ts";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

test("crea cuentas con POST y propaga los errores de dominio del backend", async (t) => {
  tokenManager.setToken(null);
  let duplicate = false;
  let request;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    request = { url, options };
    if (duplicate) {
      return jsonResponse({
        statusCode: 409,
        code: "EMAIL_ALREADY_REGISTERED",
        message: "Email already registered",
        timestamp: "2026-11-12T00:00:00.000Z",
        path: "/api/v1/users",
      }, 409);
    }
    return jsonResponse({
      id: "user-uuid",
      email: "person@example.com",
      role: "STAFF",
      status: "ACTIVE",
    }, 201);
  });

  const input = {
    email: "person@example.com",
    password: "secure-password",
    role: "STAFF",
  };
  assert.deepEqual(await createUser(input), {
    id: "user-uuid",
    email: "person@example.com",
    role: "STAFF",
    status: "ACTIVE",
  });
  assert.equal(request.url, "/api/v1/users");
  assert.equal(request.options.method, "POST");
  assert.equal(
    new Headers(request.options.headers).get("Content-Type"),
    "application/json",
  );
  assert.deepEqual(JSON.parse(request.options.body), input);

  duplicate = true;
  await assert.rejects(createUser(input), (error) => {
    return (
      error instanceof AuthError &&
      error.statusCode === 409 &&
      error.code === "EMAIL_ALREADY_REGISTERED"
    );
  });
});

test("consulta cuentas con búsqueda por correo, rol y seis resultados por página", async (t) => {
  tokenManager.setToken(null);
  let requestUrl = "";
  t.mock.method(globalThis, "fetch", async (url) => {
    requestUrl = url;
    return jsonResponse({
      items: [],
      page: 2,
      pageSize: 6,
      total: 7,
      totalPages: 2,
    });
  });

  const result = await listUserAccounts({
    page: 2,
    search: "persona@ejemplo.com",
    role: "STAFF",
  });
  const query = new URL(requestUrl, "http://localhost").searchParams;

  assert.equal(USER_PAGE_SIZE, 6);
  assert.equal(query.get("page"), "2");
  assert.equal(query.get("pageSize"), "6");
  assert.equal(query.get("search"), "persona@ejemplo.com");
  assert.equal(query.get("role"), "STAFF");
  assert.equal(query.get("order"), "asc");
  assert.equal(result.totalPages, 2);
});

test("elimina cuentas con DELETE y traduce la protección de administradores", async (t) => {
  tokenManager.setToken(null);
  let request;
  let protectAdministrator = false;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    request = { url, options };
    if (protectAdministrator) {
      return jsonResponse(
        { message: "Administrator accounts cannot be deleted" },
        409,
      );
    }
    return new Response(null, { status: 204 });
  });

  await deleteUserAccount("user-uuid");
  assert.equal(request.options.method, "DELETE");
  assert.match(request.url, /\/users\/user-uuid$/);

  protectAdministrator = true;
  await assert.rejects(deleteUserAccount("admin-uuid"), {
    message: "No se pueden eliminar las cuentas de administrador.",
  });
});

test("elimina la cuenta propia con DELETE /users/me", async (t) => {
  tokenManager.setToken(null);
  let request;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    request = { url, options };
    return new Response(null, { status: 204 });
  });

  await deleteMyAccount();

  assert.match(request.url, /\/users\/me$/);
  assert.equal(request.options.method, "DELETE");
});
