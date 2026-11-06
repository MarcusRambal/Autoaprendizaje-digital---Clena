// App.tsx
import './App.css';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';

import { WelcomePage } from './roles/public/pages/WelcomePage';
import { MainLayout } from './MainLayout';

// Autenticación
import { SignUp } from './auth/SignUp';
import { Login } from './auth/Login';

// Usuario público y visitantes
import { PublicDashboard } from './roles/public/pages/PublicDashboard';
import { Guides } from './roles/public/pages/Guides';
import { Quiz } from './roles/public/pages/Quiz';
import { Progress } from './roles/public/pages/Progress';
import { Help } from './roles/public/pages/Help';

// Administración y personal
import { AdminDashboard } from './roles/admin/pages/AdminDashboard';
import { ControlPanel } from './features/content-management/ControlPanel';
import { HelpRequestManager } from './roles/staff/pages/HelpRequestManager';
import { StatsDashboard } from './roles/staff/pages/StatsDashboard';
import { StaffDashboard } from './roles/staff/pages/StaffDashboard';
import { AdminFeature } from './roles/admin/pages/AdminFeature';

import { ProtectedRoute } from './components/ProtectedRoute';


const router = createBrowserRouter([
  // --- Rutas Públicas ---
  {
    path: '/',
    element: <WelcomePage />,
  },
  {
    path: '/signUp',
    element: <SignUp />,
  },
  {
    path: '/login',
    element: <Login />,
  },

  // --- Aprendizaje público ---
  {
    path: '/StudentsHome',
    element: <MainLayout />,
    children: [
      { index: true, element: <PublicDashboard /> },
      { path: 'Guides', element: <Guides /> },
      { path: 'Quiz', element: <Quiz /> },
      { path: 'Security', element: <Navigate to="/StudentsHome/Guides" replace /> },
      { path: 'Help', element: <Help /> },
      {
        element: <ProtectedRoute allowedRoles={['student']} />,
        children: [
          { path: 'Progress', element: <Progress /> },
        ],
      },
    ],
  },

  // --- Rutas del Administrador ---
  {
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        path: '/Admin',
        element: <MainLayout/>,
        children: [
          {
            path: '',
            element: <AdminDashboard />,
          },
          {
            path: 'ControlPanel',
            element: <ControlPanel mode="categories"/>
          },
          { path: 'Users', element: <AdminFeature feature="users" /> },
          { path: 'Audit', element: <AdminFeature feature="audit" /> },
          { path: 'Privacy', element: <AdminFeature feature="privacy" /> },
          { path: 'Backups', element: <AdminFeature feature="backups" /> },
        ],
      },
    ],
  },

  // --- Rutas del personal de contenido ---
  {
    element: <ProtectedRoute allowedRoles={['staff']} />,
    children: [
      {
        path: '/Staff',
        element: <MainLayout />,
        children: [
          { index: true, element: <StaffDashboard /> },
          { path: 'Content', element: <ControlPanel mode="content" /> },
          { path: 'Requests', element: <HelpRequestManager /> },
          { path: 'Statistics', element: <StatsDashboard /> },
        ],
      },
    ],
  },

  { path: '/Admin/Requests', element: <Navigate to="/Staff/Requests" replace /> },
  { path: '/Admin/Statistics', element: <Navigate to="/Staff/Statistics" replace /> },
  // --- Catch-All (Ruta 404 para cualquier URL no coincidente) ---
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}