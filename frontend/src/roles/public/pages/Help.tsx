import { Link } from 'react-router-dom';

export const Help = () => (
  <div className="public-page">
    <h1>Necesito ayuda presencial</h1>
    <div className="public-notice" role="status">
      <strong>La solicitud digital todavía no está disponible.</strong>
      <p>Esta página no envía un aviso ni notifica al personal. Por ahora, acércate directamente al personal del CLENA y pide ayuda presencial.</p>
    </div>
    <p>Para situaciones de emergencia, contacta a los servicios de emergencia locales.</p>
    <Link to="/StudentsHome">Volver al inicio</Link>
  </div>
);
