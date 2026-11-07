// MainLayout.tsx
import { Outlet, useLocation } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import './shared/styles/OperationsTheme.css';

export const MainLayout = () => {
  const { pathname } = useLocation();
  const isAdmin = /^\/(?:admin|staff)(?:\/|$)/i.test(pathname);
  const publicPageClasses: Record<string, string> = {
    '/StudentsHome': 'public-layout--dashboard',
    '/StudentsHome/Guides': 'public-layout--guides',
    '/StudentsHome/Quiz': 'public-layout--lessons',
    '/StudentsHome/Progress': 'public-layout--progress',
    '/StudentsHome/Help': 'public-layout--help',
  };
  const publicPageClass = publicPageClasses[pathname] ?? '';
  const layoutClass = isAdmin ? 'admin-layout' : `public-layout ${publicPageClass}`;

  return (
    <div className={layoutClass}>
      <a className="skip-link" href="#main-content">Saltar al contenido principal</a>
      <NavBar />
      <main className="content" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
};