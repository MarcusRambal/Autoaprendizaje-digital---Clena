import { useState, type FormEvent } from 'react';
import './Help.css';

export const Help = () => {
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice('Tu solicitud no se envió porque el servicio aún no está conectado. Acércate al personal de CLENA para recibir ayuda.');
  };

  return (
    <section className="public-page help-page" aria-labelledby="help-title">
      <header className="help-header">
        <h1 id="help-title">Ayuda</h1>
        <button className="help-submit" type="submit" form="student-help-form">Enviar solicitud</button>
      </header>

      <form className="help-form" id="student-help-form" onSubmit={handleSubmit}>
        <label className="help-visually-hidden" htmlFor="help-name">Nombre</label>
        <input id="help-name" name="name" type="text" placeholder="Nombre" autoComplete="name" required maxLength={100} />
        <label className="help-visually-hidden" htmlFor="help-subject">Asunto</label>
        <input id="help-subject" name="subject" type="text" placeholder="Asunto" required maxLength={160} />
        <label className="help-visually-hidden" htmlFor="help-description">Descripción</label>
        <textarea id="help-description" name="description" placeholder="Descripción" required maxLength={2000} />
        <p className="help-disclaimer">Por ahora, el formulario no envía solicitudes ni notifica al personal. Para recibir ayuda, acércate al equipo de CLENA.</p>
        {notice && <p className="help-status" role="status" aria-live="polite">{notice}</p>}
      </form>
      <p className="help-emergency">Para situaciones de emergencia, contacta a los servicios de emergencia locales.</p>
    </section>
  );
};
