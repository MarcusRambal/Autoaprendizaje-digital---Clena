import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { accessTokenExpiresAt, appRole, authRequest, logoutRequest, AuthError, type AuthSession, type Credentials } from './authApi';
import { AuthContext, type AuthContextType } from './authState';

const storageKey = 'clena_refresh_token';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
let pendingRefresh: { token: string; promise: Promise<AuthSession> } | null = null;

function refreshOnce(token: string): Promise<AuthSession> {
  if (pendingRefresh?.token === token) return pendingRefresh.promise;
  const promise = authRequest('refresh', { refreshToken: token }, apiBaseUrl);
  pendingRefresh = { token, promise };
  const clearPending = () => {
    if (pendingRefresh?.promise === promise) pendingRefresh = null;
  };
  void promise.then(clearPending, clearPending);
  return promise;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(() => sessionStorage.getItem(storageKey) !== null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const generation = useRef(0);

  const saveSession = useCallback((next: AuthSession) => {
    accessTokenExpiresAt(next.accessToken);
    appRole(next.user.role);
    sessionStorage.setItem(storageKey, next.refreshToken);
    setSession(next);
    setSessionError(null);
  }, []);

  useEffect(() => {
    let active = true;
    const currentGeneration = generation.current;
    const token = sessionStorage.getItem(storageKey);
    if (!token) return;
    refreshOnce(token).then((next) => {
      if (active && generation.current === currentGeneration) saveSession(next);
    }).catch((error: unknown) => {
      if (active && generation.current === currentGeneration) {
        sessionStorage.removeItem(storageKey);
        setSessionError(error instanceof Error ? error.message : 'No se pudo recuperar la sesión.');
      }
    }).finally(() => {
      if (active && generation.current === currentGeneration) setIsLoading(false);
    });
    return () => { active = false; };
  }, [saveSession]);

  useEffect(() => {
    if (!session) return;
    let active = true;
    const currentGeneration = generation.current;
    const remaining = accessTokenExpiresAt(session.accessToken) - Date.now();
    const delay = Math.max(1_000, remaining - Math.min(30_000, remaining * 0.1));
    const timer = window.setTimeout(() => {
      refreshOnce(session.refreshToken).then((next) => {
        if (active && generation.current === currentGeneration) saveSession(next);
      }).catch((error: unknown) => {
        if (active && generation.current === currentGeneration) {
          sessionStorage.removeItem(storageKey);
          setSession(null);
          setSessionError(error instanceof Error ? error.message : 'No se pudo renovar la sesión.');
        }
      });
    }, delay);
    return () => { active = false; window.clearTimeout(timer); };
  }, [session, saveSession]);

  const authenticate = useCallback(async (action: 'login' | 'register', credentials: Credentials) => {
    const currentGeneration = ++generation.current;
    const next = await authRequest(action, credentials, apiBaseUrl);
    if (generation.current !== currentGeneration) throw new AuthError('La solicitud de sesión fue cancelada.');
    saveSession(next);
    setIsLoading(false);
    return appRole(next.user.role);
  }, [saveSession]);

  const logout = useCallback(() => {
    const refreshToken = session?.refreshToken;
    generation.current += 1;
    sessionStorage.removeItem(storageKey);
    setSession(null);
    setSessionError(null);
    setIsLoading(false);
    if (refreshToken) {
      void logoutRequest(refreshToken, apiBaseUrl).catch((error: unknown) => {
        if (error instanceof AuthError && error.status === 401) return;
        const detail = error instanceof Error ? error.message : 'Error desconocido.';
        setSessionError(
          `La sesión se cerró en este navegador, pero no se pudo revocar en el servidor: ${detail}`,
        );
      });
    }
  }, [session]);

  const value = useMemo<AuthContextType>(() => ({
    user: session ? { id: session.user.id, email: session.user.email, userRole: appRole(session.user.role) } : null,
    token: session?.accessToken ?? null,
    login: (credentials) => authenticate('login', credentials),
    register: (credentials) => authenticate('register', credentials),
    logout,
    isAuthenticated: session !== null,
    isLoading,
    sessionError,
  }), [session, authenticate, logout, isLoading, sessionError]);

  return <AuthContext value={value}>{children}</AuthContext>;
};
