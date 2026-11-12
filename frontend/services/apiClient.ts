import { AuthError, authRequest, type AuthSession } from "./authApi.ts";
import { tokenManager } from "./tokenManager.ts";

const apiBaseUrl = import.meta.env?.VITE_API_BASE_URL || "/api/v1";

let pendingRefresh: Promise<AuthSession> | null = null;

export function refreshSession(): Promise<AuthSession> {
  if (pendingRefresh) return pendingRefresh;

  const startingTokenVersion = tokenManager.getTokenVersion();
  const refreshPromise = authRequest("refresh", undefined, apiBaseUrl)
    .then((session) => {
      if (tokenManager.getTokenVersion() === startingTokenVersion) {
        tokenManager.setToken(session.accessToken);
      }
      return session;
    })
    .catch((error: unknown) => {
      if (tokenManager.getTokenVersion() === startingTokenVersion) {
        tokenManager.triggerUnauthorized();
      }
      throw error;
    });

  pendingRefresh = refreshPromise;
  const clearPendingRefresh = () => {
    if (pendingRefresh === refreshPromise) pendingRefresh = null;
  };
  void refreshPromise.then(clearPendingRefresh, clearPendingRefresh);

  return refreshPromise;
}

function requestUrl(endpoint: string): string {
  return `${apiBaseUrl.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`;
}

async function responseError(response: Response): Promise<AuthError> {
  const data: unknown = await response.json().catch(() => null);
  if (data && typeof data === "object" && "message" in data) {
    const message = data.message;
    if (typeof message === "string") {
      return new AuthError(message, response.status);
    }
    if (
      Array.isArray(message) &&
      message.every((item) => typeof item === "string")
    ) {
      return new AuthError(message.join(", "), response.status);
    }
  }
  return new AuthError(
    `La solicitud falló (${response.status}).`,
    response.status,
  );
}

async function apiResponse(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const url = requestUrl(endpoint);
  const requestToken = tokenManager.getToken();
  const requestTokenVersion = tokenManager.getTokenVersion();

  const makeRequest = (token: string | null): Promise<Response> => {
    const headers = new Headers(options.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  };

  let response = await makeRequest(requestToken);

  if (response.status === 401) {
    let retryToken = tokenManager.getToken();
    const tokenVersionChanged =
      tokenManager.getTokenVersion() !== requestTokenVersion;

    if (!tokenVersionChanged && retryToken === requestToken) {
      try {
        await refreshSession();
      } catch (error) {
        const currentToken = tokenManager.getToken();
        const sessionChanged =
          tokenManager.getTokenVersion() !== requestTokenVersion;
        if (!sessionChanged || !currentToken) throw error;
      }
      retryToken = tokenManager.getToken();
    }

    if (!retryToken) {
      throw new AuthError("Sesión expirada. Inicia sesión de nuevo.", 401);
    }

    response = await makeRequest(retryToken);
    if (response.status === 401) {
      tokenManager.triggerUnauthorized();
      throw new AuthError("Sesión expirada. Inicia sesión de nuevo.", 401);
    }
  }

  if (!response.ok) throw await responseError(response);
  return response;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await apiResponse(endpoint, options);
  if (response.status === 204) return undefined as T;

  try {
    const data: unknown = await response.json();
    return data as T;
  } catch {
    throw new AuthError(
      "La API devolvió una respuesta JSON inválida.",
      response.status,
    );
  }
}

export async function apiBlobClient(
  endpoint: string,
  options: RequestInit = {},
): Promise<Blob> {
  const response = await apiResponse(endpoint, options);
  return response.blob();
}
