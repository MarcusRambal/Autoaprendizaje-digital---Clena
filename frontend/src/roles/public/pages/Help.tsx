import { useState, type FormEvent } from 'react';
import { mockPublicLearningService } from '../../../../services/publicLearning';
import './Help.css';

export const Help = () => {
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const formData = new FormData(event.currentTarget);
    setPending(true);
    setNotice(null);
    try {
      const result = await mockPublicLearningService.submitHelpRequest({
        name: String(formData.get('name') ?? ''),
        subject: String(formData.get('subject') ?? ''),
        description: String(formData.get('description') ?? ''),
      });
      setNotice(result.submitted
        ? 'Tu solicitud fue enviada.'
        : 'No se envió: el servicio todavía no está conectado. Acércate al personal de CLENA para recibir ayuda.');
    } catch (reason) {
      setNotice(reason instanceof Error
        ? `No se pudo enviar la solicitud: ${reason.message}`
        : 'No se pudo enviar la solicitud. Inténtalo más tarde.');
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="public-page help-page" aria-labelledby="help-title">
      <header className="help-header">
        <div>
          <p className="public-eyebrow">Estamos para ayudarte</p>
          <h1 id="help-title">Ayuda</h1>
          <p>Cuéntanos qué necesitas y te orientaremos cuando el servicio esté conectado.</p>
        </div>
        <button className="public-button" type="submit" form="student-help-form" disabled={pending}>
          {pending ? 'Enviando…' : 'Enviar solicitud'}
        </button>
      </header>

      <form className="help-form" id="student-help-form" onSubmit={handleSubmit}>
        <label htmlFor="help-name">Nombre</label>
        <input id="help-name" name="name" type="text" autoComplete="name" required maxLength={100} />
        <label htmlFor="help-subject">Asunto</label>
        <input id="help-subject" name="subject" type="text" required maxLength={160} />
        <label htmlFor="help-description">¿En qué podemos ayudarte?</label>
        <textarea id="help-description" name="description" required maxLength={2000} />
        <p className="help-disclaimer">Formulario de demostración: no guarda ni envía datos al servidor.</p>
        {notice && <p className="help-status" role="status" aria-live="polite">{notice}</p>}
      </form>
      <p className="help-emergency">Para situaciones de emergencia, contacta a los servicios de emergencia locales.</p>
    </section>
  );
};
