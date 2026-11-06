import { Link } from 'react-router-dom';

export const Guides = () => (
  <div className="public-page">
    <h1>Guías paso a paso</h1>
    <p>Ejemplo educativo disponible sin iniciar sesión. El catálogo conectado al servidor está pendiente.</p>
    <article className="public-card">
      <h2>Cómo reconocer un mensaje sospechoso</h2>
      <ol className="public-steps">
        <li>Lee con calma el mensaje y revisa quién lo envió.</li>
        <li>Desconfía si te pide contraseñas, códigos o dinero con urgencia.</li>
        <li>No abras enlaces ni archivos que no esperabas. Confirma por otro medio quién lo envió o consulta a una persona de confianza.</li>
      </ol>
      <Link to="/StudentsHome/Quiz">Practicar con un cuestionario</Link>
    </article>
  </div>
);
