import { Link } from 'react-router-dom';
import '../../staff/pages/StaffDashboard.css';

export const AdminDashboard = () => (
  <section className="staff-dashboard" aria-labelledby="admin-dashboard-title">
    <header className="staff-dashboard-header">
      <p className="staff-dashboard-eyebrow">CLENA · Administración</p>
      <h1 id="admin-dashboard-title">Panel de administración</h1>
      <p>Elige una tarea para continuar.</p>
    </header>
    <nav className="staff-dashboard-grid" aria-label="Herramientas de administración">
      <Link className="staff-dashboard-card" to="/Admin/ControlPanel">
        <span className="staff-dashboard-card__eyebrow">Contenido</span>
        <strong>Categorías</strong>
        <span>Consulta, crea, modifica o elimina categorías.</span>
        <span className="staff-dashboard-card__action">Administrar categorías <span aria-hidden="true">→</span></span>
      </Link>
      <Link className="staff-dashboard-card staff-dashboard-card--requests" to="/Admin/Users">
        <span className="staff-dashboard-card__eyebrow">Acceso</span>
        <strong>Usuarios</strong>
        <span>Prepara cuentas de usuario público o personal.</span>
        <span className="staff-dashboard-card__action">Crear usuario <span aria-hidden="true">→</span></span>
      </Link>
      <Link className="staff-dashboard-card staff-dashboard-card--statistics" to="/Admin/Privacy">
        <span className="staff-dashboard-card__eyebrow">Tus datos</span>
        <strong>Privacidad</strong>
        <span>Consulta el consentimiento y la opción de eliminación de cuenta.</span>
        <span className="staff-dashboard-card__action">Ver privacidad <span aria-hidden="true">→</span></span>
      </Link>
    </nav>
    <p className="staff-dashboard-note" role="status">La gestión de categorías está conectada al servidor; la administración de usuarios sigue siendo una demostración.</p>
  </section>
);
