import { AuthError } from "./authApi.ts";
import { apiClient } from "./apiClient.ts";
import type { Category } from "../types/contracts.ts";

interface CategoryResponse {
  id: string;
  title: string;
}

interface CategoryPageResponse {
  items: CategoryResponse[];
  totalPages: number;
}

const PAGE_SIZE = 100;

type CategoryAction = "list" | "create" | "rename" | "delete";

function categoryError(error: unknown, action: CategoryAction): Error {
  const status = error instanceof AuthError ? error.status : undefined;
  let message: string;

  if (status === 400) {
    message =
      "El nombre debe tener entre 1 y 80 caracteres e incluir al menos una letra o un número.";
  } else if (status === 401) {
    message = "Tu sesión venció. Inicia sesión de nuevo.";
  } else if (status === 403) {
    message = "No tienes permiso para administrar categorías.";
  } else if (status === 404) {
    message = "La categoría ya no existe. Actualiza la lista e inténtalo de nuevo.";
  } else if (status === 409 && action === "delete") {
    message =
      "No se puede eliminar la categoría porque tiene guías o actividades asociadas. Reasígnalas antes de intentarlo de nuevo.";
  } else if (status === 409) {
    message = "Ya existe una categoría con ese nombre.";
  } else {
    const messages: Record<CategoryAction, string> = {
      list: "No se pudieron cargar las categorías. Inténtalo de nuevo.",
      create: "No se pudo crear la categoría. Inténtalo de nuevo.",
      rename: "No se pudo actualizar la categoría. Inténtalo de nuevo.",
      delete: "No se pudo eliminar la categoría. Inténtalo de nuevo.",
    };
    message = messages[action];
  }

  return new Error(message);
}

async function requestCategory<T>(
  action: CategoryAction,
  request: () => Promise<T>,
): Promise<T> {
  try {
    return await request();
  } catch (error) {
    throw categoryError(error, action);
  }
}

export async function listCategories(): Promise<Category[]> {
  const categories: Category[] = [];
  let page = 1;

  while (true) {
    const response = await requestCategory("list", () =>
      apiClient<CategoryPageResponse>(
        `/categories?page=${page}&pageSize=${PAGE_SIZE}`,
      ),
    );
    categories.push(...response.items);
    if (page >= response.totalPages) break;
    page += 1;
  }

  return categories;
}

export function createCategory(title: string): Promise<Category> {
  return requestCategory("create", () =>
    apiClient<CategoryResponse>("/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }),
  );
}

export function renameCategory(
  id: string,
  title: string,
): Promise<Category> {
  return requestCategory("rename", () =>
    apiClient<CategoryResponse>(`/categories/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }),
  );
}

export function deleteCategory(id: string): Promise<void> {
  return requestCategory("delete", () =>
    apiClient<void>(`/categories/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  );
}
