import { AuthError, type BackendRole } from "./authApi.ts";
import { apiClient } from "./apiClient.ts";

export type UserAccountStatus = "ACTIVE" | "DISABLED" | "ARCHIVED";

export interface UserAccount {
  id: string;
  email: string;
  role: BackendRole;
  status: UserAccountStatus;
  createdAt: string;
}

export interface UserAccountPage {
  items: UserAccount[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface UserAccountFilters {
  page: number;
  search: string;
  role: BackendRole | "";
}

export const USER_PAGE_SIZE = 6;

function userError(error: unknown, action: "list" | "delete"): Error {
  const status = error instanceof AuthError ? error.status : undefined;

  if (status === 401) {
    return new Error("Tu sesión venció. Inicia sesión de nuevo.");
  }
  if (status === 403) {
    return new Error("No tienes permiso para administrar cuentas de usuario.");
  }
  if (status === 404 && action === "delete") {
    return new Error("La cuenta ya no existe. Actualiza la lista e inténtalo de nuevo.");
  }
  if (status === 409 && action === "delete") {
    return new Error("No se pueden eliminar las cuentas de administrador.");
  }

  return new Error(
    action === "list"
      ? "No se pudieron cargar las cuentas de usuario. Inténtalo de nuevo."
      : "No se pudo eliminar la cuenta. Inténtalo de nuevo.",
  );
}

async function requestUsers<T>(
  action: "list" | "delete",
  request: () => Promise<T>,
): Promise<T> {
  try {
    return await request();
  } catch (error) {
    throw userError(error, action);
  }
}

export function listUserAccounts(
  filters: UserAccountFilters,
): Promise<UserAccountPage> {
  const query = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(USER_PAGE_SIZE),
    order: "asc",
  });
  if (filters.search) query.set("search", filters.search);
  if (filters.role) query.set("role", filters.role);

  return requestUsers("list", () =>
    apiClient<UserAccountPage>(`/users?${query.toString()}`),
  );
}

export function deleteUserAccount(id: string): Promise<void> {
  return requestUsers("delete", () =>
    apiClient<void>(`/users/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  );
}
