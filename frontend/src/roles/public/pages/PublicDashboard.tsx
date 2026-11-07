import { Link } from 'react-router-dom';
import { useAuth } from '../../../../services/authState';
import './PublicDashboard.css';

export const PublicDashboard = () => {
  const { user } = useAuth();
  const isStudent = user?.userRole === 'student';

  return (
    <section className="public-page public-dashboard" aria-labelledby="dashboard-title">
      <h1 id="dashboard-title">Aprende a tu ritmo</h1>
      <div className="public-dashboard__heading">
        <h2>¿Qué quieres hacer hoy?</h2>
        <Link to="/StudentsHome/Help">¿Necesitas ayuda?</Link>
      </div>

      <nav className="public-dashboard__cards" aria-label="Opciones de aprendizaje">
        <Link className="dashboard-card dashboard-card--guides" to="/StudentsHome/Guides">
          <span className="dashboard-card__top">
            <strong>Guías</strong>
            <svg aria-hidden="true" viewBox="0 0 64 64" fill="none">
              <rect x="14" y="6" width="39" height="52" rx="2" />
              <path d="M14 15h-4v4h4m0 7h-4v4h4m0 7h-4v4h4m0 7h-4v4h4" />
              <circle cx="34" cy="27" r="11" />
              <path d="M34 22v11m0-16v.5M23 45h22M23 51h22" />
            </svg>
          </span>
          <span className="dashboard-card__description">Aprende con explicaciones sencillas</span>
        </Link>

        <Link className="dashboard-card dashboard-card--lessons" to="/StudentsHome/Quiz">
          <span className="dashboard-card__top">
            <strong>Lecciones</strong>
            <svg aria-hidden="true" viewBox="0 0 64 64" fill="none">
              <path d="M17 7h38v39H33M11 13h38v29H28" />
              <path d="M23 20h22M23 26h15M23 32h11" />
              <circle cx="18" cy="34" r="7" />
              <path d="M5 56v-7c0-6 5-10 11-10h3c3 0 5 1 7 3l8-8a4 4 0 0 1 6 6L28 55H5Z" />
            </svg>
          </span>
          <span className="dashboard-card__description">Pon a prueba tu conocimiento</span>
        </Link>

        <Link className="dashboard-card dashboard-card--progress" to="/StudentsHome/Progress">
          <strong>Mi progreso</strong>
          {!isStudent && <span className="dashboard-card__description">Inicia sesión para consultar esta sección.</span>}
        </Link>
      </nav>
    </section>
  );
};
