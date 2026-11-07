import { Link } from 'react-router-dom';
import '../../../shared/styles/OperationsDashboard.css';
import './StaffDashboard.css';

export const StaffDashboard = () => (
  <section className="staff-dashboard" aria-labelledby="staff-dashboard-title">
    <header className="staff-dashboard-header">
      <p className="staff-dashboard-eyebrow">CLENA · Espacio de personal</p>
      <h1 id="staff-dashboard-title">Panel de gestión</h1>
      <p>Elige una tarea para continuar.</p>
    </header>

    <nav className="staff-dashboard-grid" aria-label="Herramientas del personal">
      <Link className="staff-dashboard-card staff-dashboard-card--guides" to="/Staff/Content">
        <span className="staff-dashboard-card__eyebrow">Contenido</span>
        <strong>Guías y lecciones</strong>
        <span>Consulta, crea, actualiza o elimina contenido de aprendizaje.</span>
        <span className="staff-dashboard-card__action">Administrar contenido <span aria-hidden="true">→</span></span>
      </Link>
      <Link className="staff-dashboard-card staff-dashboard-card--requests" to="/Staff/Requests">
        <span className="staff-dashboard-card__eyebrow">Acompañamiento</span>
        <strong>Solicitudes</strong>
        <span>Revisa las solicitudes de ayuda de la comunidad.</span>
        <span className="staff-dashboard-card__action">Ver solicitudes <span aria-hidden="true">→</span></span>
      </Link>
      <Link className="staff-dashboard-card staff-dashboard-card--statistics" to="/Staff/Statistics">
        <span className="staff-dashboard-card__eyebrow">Actividad</span>
        <strong>Estadísticas</strong>
        <span>Consulta un resumen de la actividad de aprendizaje.</span>
        <span className="staff-dashboard-card__action">Ver estadísticas <span aria-hidden="true">→</span></span>
      </Link>
    </nav>

    <p className="staff-dashboard-note" role="status">
      Las solicitudes y estadísticas aún muestran datos de demostración.
    </p>
  </section>
);
