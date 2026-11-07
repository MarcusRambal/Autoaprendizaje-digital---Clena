// NavBar.tsx
import './NavBar.css';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { GUEST_LINKS, NAV_LINKS } from '../../config/navConfig';
import { useAuth } from '../../services/authState';

export const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userRole = user?.userRole;
  const currentLinks = userRole ? NAV_LINKS[userRole] : GUEST_LINKS;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="navbar" aria-label="Navegación principal">
      <div className="navBar-logo">
        <Link to="/">Clena</Link>
      </div>

      <ul className="nav-links">
        {currentLinks.map((link) => (
          <li key={link.path}>
            <NavLink to={link.path} end>{link.label}</NavLink>
          </li>
        ))}
      </ul>

      {user ? (
        <button type="button" className="logout-btn" onClick={handleLogout}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" />
            <path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2" />
          </svg>
          Cerrar sesión
        </button>
      ) : <Link className="login-link" to="/login">Iniciar sesión</Link>}
    </nav>
  );
};