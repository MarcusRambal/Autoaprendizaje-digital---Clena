import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/authState';
import { homePathForRole } from '../../services/authApi';
import './Login.css';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromProgress = location.state?.from === '/StudentsHome/Progress';
  const { login, sessionError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      const role = await login({ email: email.trim(), password });
      navigate(fromProgress && role === 'student' ? '/StudentsHome/Progress' : homePathForRole(role), { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo iniciar sesión.');
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="auth-page auth-page--login">
      <section className="auth-card" aria-labelledby="login-title">
        <Link className="auth-back" to="/">← Volver al inicio</Link>
        <p className="auth-eyebrow">Bienvenido a CLENA</p>
        <h1 id="login-title">Iniciar sesión</h1>
        <p>Escribe el correo y la contraseña que usaste al crear tu cuenta.</p>
        {fromProgress && <p>Inicia sesión con tu cuenta de estudiante para consultar tu progreso.</p>}
        {(error || sessionError) && <p className="auth-error" role="alert">{error || sessionError}</p>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Correo electrónico</label>
          <input id="login-email" type="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label htmlFor="login-password">Contraseña</label>
          <input id="login-password" type="password" name="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className="auth-primary" type="submit" disabled={pending}>{pending ? 'Ingresando…' : 'Iniciar sesión'}</button>
        </form>
        <div className="auth-footer">
          <p>¿Aún no tienes cuenta? <Link to="/signUp">Crear una cuenta</Link></p>
          <Link to="/StudentsHome/Help">¿Olvidaste tu contraseña?</Link>
        </div>
      </section>
    </main>
  );
};
