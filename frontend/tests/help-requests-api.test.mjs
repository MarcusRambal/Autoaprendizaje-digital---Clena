import assert from "node:assert/strict";
import test from "node:test";
import {
  createHelpRequest,
  deleteHelpRequest,
  listHelpRequests,
  listMyHelpRequests,
  updateHelpRequestStatus,
} from "../services/helpRequestsApi.ts";
import { tokenManager } from "../services/tokenManager.ts";

const requestResponse = {
  id: "request-uuid",
  requesterName: "María López",
  requesterEmail: "maria@example.com",
  topic: "Correo electrónico",
  description: "No puedo entrar a mi correo",
  date: "2026-11-09",
  status: "IN_PROGRESS",
  createdAt: "2026-11-09T15:00:00.000Z",
  attendedAt: null,
};

test("lista solicitudes con filtros y seis elementos por página", async (t) => {
  tokenManager.setToken(null);
  let calledUrl;
  t.mock.method(globalThis, "fetch", async (url) => {
    calledUrl = url;
    return Response.json({
      items: [requestResponse],
      page: 1,
      pageSize: 6,
      total: 1,
      totalPages: 1,
    });
  });

  const result = await listHelpRequests({
    page: 1,
    status: "IN_PROGRESS",
    requester: " María ",
    date: "2026-11-09",
  });

  const url = new URL(calledUrl, "http://localhost");
  assert.equal(url.pathname, "/api/v1/help-requests");
  assert.equal(url.searchParams.get("pageSize"), "6");
  assert.equal(url.searchParams.get("status"), "IN_PROGRESS");
  assert.equal(url.searchParams.get("requester"), "María");
  assert.equal(url.searchParams.get("date"), "2026-11-09");
  assert.equal(result.items[0].status, "En Atención");
});

test("lista únicamente las solicitudes propias del usuario", async (t) => {
  tokenManager.setToken(null);
  let calledUrl;
  t.mock.method(globalThis, "fetch", async (url) => {
    calledUrl = url;
    return Response.json({
      items: [requestResponse],
      page: 1,
      pageSize: 6,
      total: 1,
      totalPages: 1,
    });
  });

  const result = await listMyHelpRequests(1);
  const url = new URL(calledUrl, "http://localhost");

  assert.equal(url.pathname, "/api/v1/help-requests/mine");
  assert.equal(url.searchParams.get("pageSize"), "6");
  assert.equal(result.items[0].status, "En Atención");
});

test("registra solicitudes y cambia estado con los cuerpos esperados", async (t) => {
  tokenManager.setToken(null);
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    return Response.json(requestResponse);
  });

  await createHelpRequest({
    requesterName: "María López",
    topic: "Correo electrónico",
    description: "No puedo entrar a mi correo",
  });
  await updateHelpRequestStatus("request-uuid", "ATTENDED");

  assert.equal(calls[0].options.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    requesterName: "María López",
    topic: "Correo electrónico",
    description: "No puedo entrar a mi correo",
  });
  assert.equal(calls[1].options.method, "PATCH");
  assert.equal(calls[1].options.body, JSON.stringify({ status: "ATTENDED" }));
});

test("elimina solicitudes y traduce errores de permisos", async (t) => {
  tokenManager.setToken(null);
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    if (options.method === "DELETE") return new Response(null, { status: 204 });
    return Response.json(
      { statusCode: 403, message: "Forbidden" },
      { status: 403 },
    );
  });

  await deleteHelpRequest("request-uuid");
  assert.equal(calls[0].options.method, "DELETE");
  await assert.rejects(
    listHelpRequests({
      page: 1,
      status: "",
      requester: "",
      date: "",
    }),
    { message: "No tienes permiso para consultar las solicitudes." },
  );
});
