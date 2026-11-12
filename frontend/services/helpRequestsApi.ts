import { AuthError } from "./authApi.ts";
import { apiClient } from "./apiClient.ts";
import type { HelpRequest, RequestStatus } from "../types/contracts.ts";

export type HelpRequestStatusCode = "PENDING" | "IN_PROGRESS" | "ATTENDED";

export interface HelpRequestPage {
  items: HelpRequest[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface HelpRequestFilters {
  page: number;
  status: HelpRequestStatusCode | "";
  requester: string;
  date: string;
}

interface ApiHelpRequest {
  id: string;
  requesterName: string | null;
  requesterEmail: string | null;
  topic: string;
  description: string;
  date: string;
  status: HelpRequestStatusCode | "CANCELLED";
  createdAt: string;
  attendedAt: string | null;
}

interface ApiHelpRequestPage {
  items: ApiHelpRequest[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export const HELP_REQUEST_PAGE_SIZE = 6;

const statusLabels: Record<ApiHelpRequest["status"], RequestStatus> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En Atención",
  ATTENDED: "Atendida",
  CANCELLED: "Cancelada",
};

function toHelpRequest(request: ApiHelpRequest): HelpRequest {
  return {
    ...request,
    status: statusLabels[request.status],
  };
}

type HelpRequestAction = "list" | "create" | "update" | "delete";

function helpRequestError(error: unknown, action: HelpRequestAction): Error {
  const status = error instanceof AuthError ? error.status : undefined;

  if (status === 401) {
    return new Error("Tu sesión venció. Inicia sesión de nuevo.");
  }
  if (status === 403) {
    const messages: Record<HelpRequestAction, string> = {
      list: "No tienes permiso para consultar las solicitudes.",
      create: "No tienes permiso para enviar solicitudes.",
      update: "No tienes permiso para cambiar el estado de solicitudes.",
      delete: "No tienes permiso para eliminar solicitudes.",
    };
    return new Error(messages[action]);
  }
  if (status === 404) {
    return new Error("La solicitud ya no existe. Actualiza la lista.");
  }
  if (status === 400 && action === "create") {
    return new Error("Revisa el nombre, el tema y la descripción de la solicitud.");
  }

  const messages: Record<HelpRequestAction, string> = {
    list: "No se pudieron cargar las solicitudes. Inténtalo de nuevo.",
    create: "No se pudo registrar la solicitud. Inténtalo de nuevo.",
    update: "No se pudo actualizar el estado. Inténtalo de nuevo.",
    delete: "No se pudo eliminar la solicitud. Inténtalo de nuevo.",
  };
  return new Error(messages[action]);
}

async function requestHelpRequests<T>(
  action: HelpRequestAction,
  request: () => Promise<T>,
): Promise<T> {
  try {
    return await request();
  } catch (error) {
    throw helpRequestError(error, action);
  }
}

export function listHelpRequests(
  filters: HelpRequestFilters,
): Promise<HelpRequestPage> {
  const query = new URLSearchParams({
    page: String(filters.page),
    pageSize: String(HELP_REQUEST_PAGE_SIZE),
    order: "asc",
  });
  if (filters.status) query.set("status", filters.status);
  if (filters.requester.trim()) query.set("requester", filters.requester.trim());
  if (filters.date) query.set("date", filters.date);

  return requestHelpRequests("list", async () => {
    const response = await apiClient<ApiHelpRequestPage>(
      `/help-requests?${query.toString()}`,
    );
    return { ...response, items: response.items.map(toHelpRequest) };
  });
}

export function listMyHelpRequests(page: number): Promise<HelpRequestPage> {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(HELP_REQUEST_PAGE_SIZE),
    order: "desc",
  });

  return requestHelpRequests("list", async () => {
    const response = await apiClient<ApiHelpRequestPage>(
      `/help-requests/mine?${query.toString()}`,
    );
    return { ...response, items: response.items.map(toHelpRequest) };
  });
}

export function createHelpRequest(input: {
  requesterName: string;
  topic: string;
  description: string;
}): Promise<HelpRequest> {
  return requestHelpRequests("create", async () => {
    const response = await apiClient<ApiHelpRequest>("/help-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return toHelpRequest(response);
  });
}

export function updateHelpRequestStatus(
  id: string,
  status: HelpRequestStatusCode,
): Promise<HelpRequest> {
  return requestHelpRequests("update", async () => {
    const response = await apiClient<ApiHelpRequest>(
      `/help-requests/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      },
    );
    return toHelpRequest(response);
  });
}

export function deleteHelpRequest(id: string): Promise<void> {
  return requestHelpRequests("delete", () =>
    apiClient<void>(`/help-requests/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  );
}
