// App.tsx
import './App.css';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';

import { Home } from './Home';
import { MainLayout } from './MainLayout'; // Importas el Layout

// SignIn
import { SignUp } from './SignIn/SignUp';
import { Login } from './SignIn/Login';

// StudentsHome
import { StudentsHome } from './StudentsHome/StudentsHome';
import { Guides } from './StudentsHome/routes/Guides';
import { Quiz } from './StudentsHome/routes/Quiz';
import { Progress } from './StudentsHome/routes/Progress';

// AdminPanel
import { AdminPanel } from './AdminPanel/AdminPanel';
import { EditGuidesPanel } from './AdminPanel/routes/EditGuidesPanel';
import { EditQuizPanel } from './AdminPanel/routes/EditQuizPanel';
import { RequestPanel } from './AdminPanel/routes/RequestPanel';
import { StatisticsPanel } from './AdminPanel/routes/StatisticsPanel';

// ProtectedRoute
import { ProtectedRoute } from './components/ProtectedRoute';

const router = createBrowserRouter([
  // --- Rutas Públicas ---
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/signUp',
    element: <SignUp />,
  },
  {
    path: '/login',
    element: <Login />,
  },

  // --- Rutas del Estudiante ---
  {
    element: <ProtectedRoute allowedRoles={['student']} />,
    children: [
      {
        path: '/StudentsHome',
        element: <MainLayout/>,
        children: [
          {
            path: '',
            element: <StudentsHome />,
          },
          {
            path: 'Guides',
            element: <Guides />,
          },
          {
            path: 'Quiz',
            element: <Quiz />,
          },
          {
            path: 'Progress',
            element: <Progress />,
          },
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
            element: <AdminPanel />,
          },
          {
            path: 'EditGuides',
            element: <EditGuidesPanel />,
          },
          {
            path: 'EditQuiz',
            element: <EditQuizPanel />,
          },
          {
            path: 'Requests',
            element: <RequestPanel />,
          },
          {
            path: 'Statistics',
            element: <StatisticsPanel />,
          },
        ],
      },
    ],
  },

  // --- Catch-All (Ruta 404 para cualquier URL no coincidente) ---
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}