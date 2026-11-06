import './WelcomePage.css';
import { Link } from 'react-router-dom';

export const WelcomePage = () => (
  <main className="welcome-page">
    <section className="welcome-content">
      <p className="welcome-brand">CLENA · Aprende a tu ritmo</p>
      <h1>Aprende a usar internet con confianza</h1>
      <p>Encuentra guías sencillas y actividades para practicar, sin necesidad de crear una cuenta.</p>
      <div className="welcome-actions">
        <Link className="welcome-primary" to="/StudentsHome">Entrar como visitante</Link>
        <Link to="/login">Iniciar sesión</Link>
        <Link to="/signUp">Crear una cuenta</Link>
      </div>
      <p>Si deseas guardar tu progreso, necesitarás una cuenta cuando esta función esté disponible.</p>
    </section>
  </main>
);
