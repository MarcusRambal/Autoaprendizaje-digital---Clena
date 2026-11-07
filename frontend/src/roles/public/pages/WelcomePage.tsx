import './WelcomePage.css';
import { Link } from 'react-router-dom';

export const WelcomePage = () => (
  <main className="welcome-page">
    <div className="welcome-art" aria-hidden="true" />
    <section className="welcome-content" aria-labelledby="welcome-title">
      <p className="welcome-brand">Clena - Aprende a tu ritmo</p>
      <h1 id="welcome-title">Aprende a usar internet con confianza y más!</h1>
      <p className="welcome-description">Encuentra guías sencillas y actividades de práctica.</p>
      <div className="welcome-actions">
        <Link to="/login">Iniciar sesión</Link>
        <Link className="welcome-signup" to="/signUp">Crear una cuenta</Link>
        <Link className="welcome-primary" to="/StudentsHome">Entra como invitado</Link>
      </div>
      <p className="welcome-note">Si deseas guardar tu progreso, necesitarás una cuenta.</p>
    </section>
  </main>
);
