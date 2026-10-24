// MainLayout.tsx
import { Outlet } from 'react-router-dom';
import { NavBar } from './components/NavBar';

export const MainLayout = () => {
  return (
    <div>
      <NavBar />
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
};