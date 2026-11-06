// services/authContext.tsx

import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react';

export interface AuthUser {
  email: string;
  userRole: 'admin' | 'student';
  [key: string]: unknown;
}

export interface AuthSession {
  user: AuthUser;
  token?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (session: AuthSession) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Recupera la sesión guardada al montar el componente (Mock/Persistencia temporal)
  useEffect(() => {
    const savedUser = localStorage.getItem('mock_user');
    const savedToken = localStorage.getItem('mock_token');

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken ?? null);
      } catch (e) {
        console.error('Error al parsear el usuario guardado', e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = ({ user, token }: AuthSession) => {
    setUser(user);
    setToken(token ?? null);
    localStorage.setItem('mock_user', JSON.stringify(user));
    if (token) localStorage.setItem('mock_token', token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('mock_user');
    localStorage.removeItem('mock_token');
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      login,
      logout,
      isAuthenticated: !!user,
      isLoading,
    }),
    [user, token, isLoading],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};