// NavBar.tsx
import './NavBar.css';
import { Link, useNavigate } from 'react-router-dom';
import { NAV_LINKS } from '../../config/navConfig';
import { useAuth } from '../../services/authContext';

export const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Si por alguna razón no hay usuario activo, no renderiza links o usa arreglo vacío
  const userRole = user?.userRole;
  console.log(userRole);
  const currentLinks = userRole ? NAV_LINKS[userRole] || [] : [];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="navbar">
      <div className="navBar-logo">
        <Link to="/">Clena</Link>
      </div>

      <ul className="nav-links">
        {currentLinks.map((link) => (
          <li key={link.path}>
            <Link to={link.path}>{link.label}</Link>
          </li>
        ))}
      </ul>

      <button className="logout-btn" onClick={handleLogout}>
        Cerrar Sesión
      </button>
    </nav>
  );
};