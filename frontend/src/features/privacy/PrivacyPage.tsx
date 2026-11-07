import { useAuth } from '../../../services/authState';
import { ConsentNotice } from './ConsentNotice';
import '../../roles/admin/pages/AdminPages.css';

export function PrivacyPage() {
  const { user } = useAuth();

  return (
    <section className="admin-page privacy-page" aria-labelledby="privacy-title">
      <header>
        <p className="admin-page-eyebrow">Tus datos</p>
        <h1 id="privacy-title">Privacidad y consentimiento</h1>
        <p>Información sobre el tratamiento de datos y la eliminación de tu cuenta.</p>
      </header>
      <section className="privacy-section">
        <h2>Tratamiento de datos</h2>
        <ConsentNotice />
      </section>
      <section className="privacy-section" aria-labelledby="delete-title">
        <h2 id="delete-title">Eliminar mi cuenta</h2>
        <p>La eliminación de la cuenta y sus datos asociados aún no está disponible.</p>
        <p>Cuenta actual: <strong>{user?.email}</strong></p>
        <p role="status">Esta opción requiere conexión con el servidor. No elimina ni modifica tu cuenta por ahora.</p>
        <div className="admin-form"><button type="button" disabled>Eliminar mi cuenta</button></div>
      </section>
    </section>
  );
}
