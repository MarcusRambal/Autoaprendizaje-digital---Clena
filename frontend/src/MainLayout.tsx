// MainLayout.tsx
import { Outlet, useLocation } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import './shared/styles/OperationsTheme.css';

export const MainLayout = () => {
  const isAdmin = /^\/(?:admin|staff)(?:\/|$)/i.test(useLocation().pathname);

  return (
    <div className={isAdmin ? 'admin-layout' : 'public-layout'}>
      <a className="skip-link" href="#main-content">Saltar al contenido principal</a>
      <NavBar />
      <main className="content" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
};