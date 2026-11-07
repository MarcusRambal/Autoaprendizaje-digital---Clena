import './WelcomePage.css';
import { Link } from 'react-router-dom';

export const WelcomePage = () => (
  <>
  <a className="welcome-skip" href="#welcome-main">Saltar al contenido principal</a>
  <main className="welcome-page" id="welcome-main" tabIndex={-1}>
    <div className="welcome-art" aria-hidden="true" />
    <section className="welcome-content" aria-labelledby="welcome-title">
      <p className="welcome-brand">CLENA <span aria-hidden="true">·</span> Aprende a tu ritmo</p>
      <h1 id="welcome-title">Aprende a usar internet con confianza y más!</h1>
      <p className="welcome-description">Encuentra guías sencillas y lecciones para practicar con confianza.</p>
      <div className="welcome-actions">
        <Link className="welcome-primary" to="/StudentsHome">Explorar como invitado</Link>
        <Link to="/login">Iniciar sesión</Link>
        <Link className="welcome-signup" to="/signUp">Crear una cuenta</Link>
      </div>
      <p className="welcome-note">Si deseas guardar tu progreso, necesitarás una cuenta.</p>
    </section>
  </main>
  </>
);
