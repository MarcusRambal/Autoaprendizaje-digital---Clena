import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

export const Quiz = () => {
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!answer) {
      setResult('Selecciona una respuesta para continuar.');
      return;
    }
    setResult(answer === 'consultar'
      ? '¡Muy bien! Ante la duda, consulta directamente a una persona de confianza.'
      : 'Es más seguro no abrir el enlace. Consulta directamente a una persona de confianza.');
  };

  return (
    <div className="public-page">
      <h1>Cuestionario de práctica</h1>
      <p>Este es un ejemplo. Tu respuesta no se guarda ni modifica tu progreso.</p>
      <form className="public-card public-quiz" onSubmit={submit}>
        <fieldset>
          <legend>Recibes un mensaje inesperado que pide tu contraseña. ¿Qué haces?</legend>
          <label><input type="radio" name="answer" value="compartir" checked={answer === 'compartir'} onChange={event => { setAnswer(event.target.value); setResult(null); }} /> Envío mi contraseña.</label>
          <label><input type="radio" name="answer" value="consultar" checked={answer === 'consultar'} onChange={event => { setAnswer(event.target.value); setResult(null); }} /> No comparto mi contraseña y consulto a alguien de confianza.</label>
        </fieldset>
        <button type="submit">Revisar respuesta</button>
        {result && <p role="status">{result}</p>}
      </form>
      <Link to="/StudentsHome/Guides">Volver a las guías</Link>
    </div>
  );
};
