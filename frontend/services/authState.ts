import { createContext, useContext } from 'react';
import type { AppRole, Credentials } from './authApi';

export interface AuthContextType {
  user: { id: string; email: string; userRole: AppRole } | null;
  token: string | null;
  login: (credentials: Credentials) => Promise<AppRole>;
  register: (credentials: Credentials) => Promise<AppRole>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionError: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  return context;
};
