import { useState, type FormEvent } from 'react';
import { passwordError } from '../../../../services/authApi';
import './AdminPages.css';

export function AdminUsers() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'PUBLIC_USER' | 'STAFF'>('PUBLIC_USER');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; role: 'PUBLIC_USER' | 'STAFF' }[]>([]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);
    const problem = passwordError(password);
    const normalizedEmail = email.trim().toLowerCase();
    if (problem) {
      setError(problem);
      return;
    }
    if (created.some(item => item.email === normalizedEmail)) {
      setError('Este correo ya está en la lista de demostración.');
      return;
    }
    setCreated(current => [...current, { email: normalizedEmail, role }]);
    setSuccess(`Se agregó ${normalizedEmail} a la lista de demostración. No se creó una cuenta real.`);
    setError(null);
    setEmail('');
    setPassword('');
    setRole('PUBLIC_USER');
  };

  return (
    <section className="admin-page" aria-labelledby="users-title">
      <header>
        <p className="admin-page-eyebrow">Administración</p>
        <h1 id="users-title">Crear usuario</h1>
        <p>Prepara una cuenta de usuario público o personal.</p>
      </header>
      <p role="status"><strong>Demostración:</strong> este formulario no crea cuentas en el servidor. La lista se borra al salir de esta página y las contraseñas no se almacenan.</p>
      <form className="admin-form" onSubmit={submit}>
        <label htmlFor="account-email">Correo electrónico</label>
        <input id="account-email" type="email" autoComplete="off" maxLength={254} required value={email} onChange={event => setEmail(event.target.value)} />
        <label htmlFor="account-password">Contraseña inicial</label>
        <input id="account-password" type="password" autoComplete="new-password" required value={password} onChange={event => setPassword(event.target.value)} aria-describedby="account-password-help" />
        <small id="account-password-help">Mínimo 8 caracteres y máximo 72 bytes. Entrégala de forma segura.</small>
        <label htmlFor="account-role">Rol</label>
        <select id="account-role" value={role} onChange={event => setRole(event.target.value === 'STAFF' ? 'STAFF' : 'PUBLIC_USER')}>
          <option value="PUBLIC_USER">Usuario público</option>
          <option value="STAFF">Personal</option>
        </select>
        {error && <p className="admin-form-error" role="alert">{error}</p>}
        {success && <p className="admin-form-success" role="status">{success}</p>}
        <button type="submit">Agregar a demostración</button>
      </form>
      {created.length > 0 && (
        <section className="privacy-section" aria-labelledby="demo-users-title">
          <h2 id="demo-users-title">Usuarios de demostración</h2>
          <ul className="admin-demo-users">
            {created.map(item => <li key={item.email}>{item.email} — {item.role === 'STAFF' ? 'Personal' : 'Usuario público'}</li>)}
          </ul>
        </section>
      )}
    </section>
  );
}
