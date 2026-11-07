// src/components/ProtectedRoute.tsx

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../services/authState';
import { homePathForRole, type AppRole } from '../../services/authApi';

interface ProtectedRouteProps {
  allowedRoles?: AppRole[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Cargando sesión...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.userRole)) {
    // Si se intenta acceder a una ruta no permitida según el rol, redirige al panel correspondiente
    const redirectPath = homePathForRole(user.userRole);
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};