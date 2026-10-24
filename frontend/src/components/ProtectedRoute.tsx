// src/components/ProtectedRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../services/authContext';

interface ProtectedRouteProps {
  allowedRoles?: Array<'admin' | 'student'>;
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Cargando sesión...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.userRole)) {
    // Si se intenta acceder a una ruta no permitida según el rol, redirige al panel correspondiente
    const redirectPath = user.userRole === 'admin' ? '/Admin' : '/StudentsHome';
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};