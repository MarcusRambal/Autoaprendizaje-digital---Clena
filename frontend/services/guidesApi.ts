import { AuthError } from "./authApi.ts";
import { apiBlobClient, apiClient } from "./apiClient.ts";
import type { Guide } from "../types/contracts.ts";

export interface ManagedGuidePage {
  items: Guide[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export const GUIDE_PAGE_SIZE = 6;

type GuideAction = "list" | "create" | "update" | "delete" | "publish" | "file";

function guideError(error: unknown, action: GuideAction): Error {
  const status = error instanceof AuthError ? error.status : undefined;

  if (status === 401) {
    return new Error("Tu sesión venció. Inicia sesión de nuevo.");
  }
  if (status === 403) {
    return new Error("No tienes permiso para administrar guías.");
  }
  if (status === 404) {
    return new Error(
      action === "list"
        ? "No se encontró el listado de guías."
        : "La guía o la categoría seleccionada ya no existe.",
    );
  }
  if (status === 400 && (action === "create" || action === "update")) {
    return new Error(
      "No se aceptaron los datos de la guía o el archivo PDF. Revisa el título, la categoría y el archivo.",
    );
  }

  const messages: Record<GuideAction, string> = {
    list: "No se pudieron cargar las guías. Inténtalo de nuevo.",
    create: "No se pudo crear la guía. Inténtalo de nuevo.",
    update: "No se pudo guardar la guía. Inténtalo de nuevo.",
    delete: "No se pudo eliminar la guía. Inténtalo de nuevo.",
    publish: "No se pudo actualizar la publicación de la guía. Inténtalo de nuevo.",
    file: "No se pudo abrir el archivo PDF de la guía.",
  };
  return new Error(messages[action]);
}

async function requestGuide<T>(
  action: GuideAction,
  request: () => Promise<T>,
): Promise<T> {
  try {
    return await request();
  } catch (error) {
    throw guideError(error, action);
  }
}

export function listManagedGuides(input: {
  page: number;
  search: string;
}): Promise<ManagedGuidePage> {
  const query = new URLSearchParams({
    page: String(input.page),
    pageSize: String(GUIDE_PAGE_SIZE),
    order: "desc",
  });
  if (input.search.trim()) query.set("search", input.search.trim());

  return requestGuide("list", () =>
    apiClient<ManagedGuidePage>(`/guides/manage?${query.toString()}`),
  );
}

export function listPublicGuides(input: {
  page: number;
  search: string;
  categoryId: string;
}): Promise<ManagedGuidePage> {
  const query = new URLSearchParams({
    page: String(input.page),
    pageSize: String(GUIDE_PAGE_SIZE),
    order: "desc",
  });
  if (input.search.trim()) query.set("search", input.search.trim());
  if (input.categoryId) query.set("categoryId", input.categoryId);

  return requestGuide("list", () =>
    apiClient<ManagedGuidePage>(`/guides?${query.toString()}`),
  );
}

export function getPublicGuide(id: string): Promise<Guide> {
  return requestGuide("list", () =>
    apiClient<Guide>(`/guides/${encodeURIComponent(id)}`),
  );
}

export function createManagedGuide(input: {
  title: string;
  categoryId: string;
  file: File;
}): Promise<Guide> {
  const body = new FormData();
  body.set("title", input.title);
  body.set("categoryId", input.categoryId);
  body.set("file", input.file);
  return requestGuide("create", () =>
    apiClient<Guide>("/guides", { method: "POST", body }),
  );
}

export function updateManagedGuide(input: {
  id: string;
  title: string;
  categoryId: string;
  file?: File;
}): Promise<Guide> {
  const body = new FormData();
  body.set("title", input.title);
  body.set("categoryId", input.categoryId);
  if (input.file) body.set("file", input.file);
  return requestGuide("update", () =>
    apiClient<Guide>(`/guides/${encodeURIComponent(input.id)}`, {
      method: "PATCH",
      body,
    }),
  );
}

export function deleteManagedGuide(id: string): Promise<void> {
  return requestGuide("delete", () =>
    apiClient<void>(`/guides/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  );
}

export function setManagedGuidePublication(
  id: string,
  published: boolean,
): Promise<Guide> {
  return requestGuide("publish", () =>
    apiClient<Guide>(`/guides/${encodeURIComponent(id)}/publication`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published }),
    }),
  );
}

export function getManagedGuidePdf(id: string): Promise<Blob> {
  return requestGuide("file", () =>
    apiBlobClient(`/guides/manage/${encodeURIComponent(id)}/file`),
  );
}

export function getPublicGuidePdf(id: string): Promise<Blob> {
  return requestGuide("file", () =>
    apiBlobClient(`/guides/${encodeURIComponent(id)}/file`),
  );
}
