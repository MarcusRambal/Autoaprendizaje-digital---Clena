export type BackendRole = "ADMIN" | "PUBLIC_USER" | "STAFF";
export type AppRole = "admin" | "staff" | "student";

export interface AuthSession {
  accessToken: string;
  user: { id: string; email: string; role: BackendRole };
}

export interface Credentials {
  email: string;
  password: string;
}

export interface RegistrationCredentials extends Credentials {
  privacyAccepted: true;
}

export class AuthError extends Error {
  readonly status?: number;
  readonly statusCode?: number;
  readonly code?: string;

  constructor(
    message: string,
    status?: number,
    code?: string,
    statusCode = status,
  ) {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function appRole(role: BackendRole): AppRole {
  if (role === "ADMIN") return "admin";
  if (role === "PUBLIC_USER") return "student";
  return "staff";
}

export function homePathForRole(role: AppRole): string {
  const paths: Record<AppRole, string> = {
    admin: "/Admin",
    staff: "/Staff",
    student: "/StudentsHome",
  };
  return paths[role];
}

export function passwordError(password: string): string | null {
  const surrogatePairs =
    password.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g) ?? [];
  const presentationSequences =
    password.match(/[^\uFE0F\uFE0E][\uFE0F\uFE0E]/g) ?? [];
  if (
    password.length - surrogatePairs.length - presentationSequences.length <
    8
  ) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }
  if (new TextEncoder().encode(password).length > 72) {
    return "La contraseña no puede superar los 72 bytes.";
  }
  return null;
}

function isSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  if (!data.user || typeof data.user !== "object") return false;
  const user = data.user as Record<string, unknown>;
  return (
    typeof data.accessToken === "string" &&
    data.accessToken.length > 0 &&
    typeof user.id === "string" &&
    user.id.length > 0 &&
    typeof user.email === "string" &&
    user.email.length > 0 &&
    (user.role === "ADMIN" ||
      user.role === "PUBLIC_USER" ||
      user.role === "STAFF")
  );
}

function errorMessage(status: number, code: unknown): string {
  if (code === "EMAIL_ALREADY_REGISTERED")
    return "Este correo ya tiene una cuenta. Inicia sesión.";
  if (status === 401)
    return "Correo, contraseña o sesión incorrectos. Inténtalo de nuevo.";
  if (status === 429)
    return "Demasiados intentos. Espera un momento y vuelve a intentarlo.";
  if (status === 400)
    return "Revisa el correo y la contraseña e inténtalo de nuevo.";
  return "No se pudo completar la solicitud. Inténtalo de nuevo más tarde.";
}

export async function authRequest(
  action: "login" | "register" | "refresh",
  body?: Credentials,
  baseUrl = "/api/v1",
): Promise<AuthSession> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, "")}/auth/${action}`, {
      method: "POST",
      credentials: "include",
      ...(body
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : {}),
    });
  } catch {
    throw new AuthError(
      "No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.",
    );
  }

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const code =
      data && typeof data === "object" && "code" in data
        ? data.code
        : undefined;
    throw new AuthError(errorMessage(response.status, code), response.status);
  }
  if (!isSession(data))
    throw new AuthError(
      "El servidor devolvió una respuesta de sesión inválida.",
    );
  appRole(data.user.role);
  return data;
}

export async function logoutRequest(baseUrl = "/api/v1"): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, "")}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    throw new AuthError(
      "No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.",
    );
  }

  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null);
    const code =
      data && typeof data === "object" && "code" in data
        ? data.code
        : undefined;
    throw new AuthError(errorMessage(response.status, code), response.status);
  }
}

export function accessTokenExpiresAt(token: string): number {
  try {
    const payload: unknown = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    if (
      payload &&
      typeof payload === "object" &&
      "exp" in payload &&
      typeof payload.exp === "number" &&
      Number.isFinite(payload.exp)
    ) {
      return payload.exp * 1000;
    }
  } catch {
    throw new AuthError("El servidor devolvió un token de acceso inválido.");
  }
  throw new AuthError("El servidor devolvió un token de acceso inválido.");
}
