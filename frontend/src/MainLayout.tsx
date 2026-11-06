// MainLayout.tsx
import { Outlet, useLocation } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import './AdminPanel/AdminTheme.css';

export const MainLayout = () => {
  const isAdmin = /^\/admin(?:\/|$)/i.test(useLocation().pathname);

  return (
    <div className={isAdmin ? 'admin-layout' : undefined}>
      {isAdmin && <a className="skip-link" href="#main-content">Saltar al contenido principal</a>}
      <NavBar />
      <main className="content" id={isAdmin ? 'main-content' : undefined} tabIndex={isAdmin ? -1 : undefined}>
        <Outlet />
      </main>
    </div>
  );
};