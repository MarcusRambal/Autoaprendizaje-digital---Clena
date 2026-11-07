import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { homePathForRole, passwordError } from '../../services/authApi';
import { useAuth } from '../../services/authState';
import './Login.css';
import './SignUp.css';

export const SignUp = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const next = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const problem = passwordError(password);
    if (problem || password !== confirmation) {
      setError(problem || 'Las contraseñas no coinciden.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const finish = async () => {
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      const role = await register({ email: email.trim(), password });
      setPassword('');
      setConfirmation('');
      navigate(homePathForRole(role), { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear la cuenta.');
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="auth-page auth-page--signup">
      <section className="auth-card" aria-labelledby="signup-title">
        <Link className="auth-back" to="/">← Volver al inicio</Link>
        <p className="auth-eyebrow">Tu cuenta en CLENA</p>
        <h1 id="signup-title">Crear una cuenta</h1>
        <p className="signup-progress" aria-live="polite">Paso {step} de 3</p>
        <ol className="signup-steps" aria-label="Pasos del registro">
          <li aria-current={step === 1 ? 'step' : undefined}>1. Tus datos</li>
          <li aria-current={step === 2 ? 'step' : undefined}>2. Cómo ingresar</li>
          <li aria-current={step === 3 ? 'step' : undefined}>3. Crear cuenta</li>
        </ol>
        {error && <p className="auth-error" role="alert">{error}</p>}

        {step === 1 && (
          <>
            <h2>Escribe tus datos</h2>
            <p>Usa un correo al que tengas acceso y crea una contraseña que puedas recordar.</p>
            <div className="auth-tip">
              <strong>¿Por qué usar una contraseña fuerte?</strong>
              <p>Una contraseña difícil de adivinar protege tu cuenta y tu progreso. Usa al menos 8 caracteres; combina palabras, números y símbolos y no la compartas.</p>
            </div>
            <form className="auth-form" onSubmit={next}>
              <label htmlFor="signup-email">Correo electrónico</label>
              <input id="signup-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <label htmlFor="signup-password">Contraseña</label>
              <input id="signup-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} aria-describedby="password-help" />
              <small id="password-help">Mínimo 8 caracteres y máximo 72 bytes.</small>
              <label htmlFor="signup-confirm">Repite tu contraseña</label>
              <input id="signup-confirm" type="password" autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required />
              <button className="auth-primary" type="submit">Continuar</button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h2>Así iniciarás sesión</h2>
            <p>Cuando regreses a CLENA, estos serán los datos que escribirás en la página de inicio de sesión:</p>
            <div className="signup-example" aria-label="Ejemplo de inicio de sesión">
              <span>Correo electrónico</span>
              <strong className="signup-email">{email.trim().toLowerCase()}</strong>
              <span>Contraseña</span>
              <strong aria-label="Tu contraseña, oculta">••••••••</strong>
              <span className="signup-example-button">Iniciar sesión</span>
            </div>
            <ol className="signup-instructions">
              <li>Abre CLENA y selecciona «Iniciar sesión».</li>
              <li>Escribe el correo que aparece arriba.</li>
              <li>Escribe tu contraseña y selecciona «Iniciar sesión».</li>
            </ol>
            <p className="auth-note">Esta es una guía visual: no recibirás un correo de verificación en este paso.</p>
            <div className="auth-actions">
              <button className="auth-secondary" type="button" onClick={() => setStep(1)}>Atrás</button>
              <button className="auth-primary" type="button" onClick={() => setStep(3)}>Entendido, continuar</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2>Todo listo para comenzar</h2>
            <p>Crearemos tu cuenta con el correo <strong className="signup-email">{email.trim().toLowerCase()}</strong> y entraremos a tu espacio de aprendizaje.</p>
            <p>Recuerda guardar tu contraseña en un lugar seguro. No la compartas con otras personas.</p>
            <div className="auth-actions">
              <button className="auth-secondary" type="button" disabled={pending} onClick={() => { setError(null); setStep(2); }}>Atrás</button>
              <button className="auth-primary" type="button" disabled={pending} onClick={finish}>{pending ? 'Creando cuenta…' : 'Crear cuenta e iniciar sesión'}</button>
            </div>
            <p>¿Ya tienes una cuenta? <Link to="/login">Iniciar sesión</Link></p>
          </>
        )}
      </section>
    </main>
  );
};
