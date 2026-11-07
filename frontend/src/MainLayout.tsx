// MainLayout.tsx
import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import './shared/styles/OperationsTheme.css';
import './roles/public/pages/PublicExperience.css';

export const MainLayout = () => {
  const { pathname, key } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const isAdmin = /^\/(?:admin|staff)(?:\/|$)/i.test(pathname);
  const publicPageClasses: Record<string, string> = {
    '/StudentsHome': 'public-layout--dashboard',
    '/StudentsHome/Guides': 'public-layout--guides',
    '/StudentsHome/Quiz': 'public-layout--lessons',
    '/StudentsHome/Progress': 'public-layout--progress',
    '/StudentsHome/Help': 'public-layout--help',
    '/StudentsHome/Privacy': 'public-layout--privacy',
  };
  const publicPageClass = publicPageClasses[pathname] ?? '';
  const layoutClass = isAdmin ? 'admin-layout' : `public-layout ${publicPageClass}`;

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const heading = main.querySelector<HTMLElement>('h1');
    const target = heading ?? main;
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [key]);

  return (
    <div className={layoutClass}>
      <a className="skip-link" href="#main-content">Saltar al contenido principal</a>
      <NavBar />
      <main className="content" id="main-content" tabIndex={-1} ref={mainRef}>
        <Outlet />
      </main>
    </div>
  );
};