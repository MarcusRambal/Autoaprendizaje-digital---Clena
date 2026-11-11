import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { deleteMyAccount } from '../../../services/usersApi';
import { useAuth } from '../../../services/authState';
import { ConsentNotice } from './ConsentNotice';
import '../../roles/admin/pages/AdminPages.css';

export function PrivacyPage() {
  const { user, clearSession } = useAuth();
  const navigate = useNavigate();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const isAdministrator = user?.userRole === 'admin';

  const handleDeleteAccount = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteMyAccount();
      navigate('/', { replace: true, flushSync: true });
      clearSession();
    } catch (reason) {
      setDeleteError(reason instanceof Error
        ? reason.message
        : 'No se pudo eliminar tu cuenta. Inténtalo de nuevo.');
    } finally {
      setIsDeleting(false);
    }
  };

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
        <p>Al eliminar tu cuenta, también se borrarán tus datos personales, progreso y solicitudes. Esta acción es permanente.</p>
        <p>Cuenta actual: <strong>{user?.email}</strong></p>
        {isAdministrator && (
          <p role="status">Por seguridad, las cuentas administradoras no se pueden eliminar desde el sitio.</p>
        )}
        <div className="admin-form">
          <button
            type="button"
            className="user-account-delete"
            disabled={!user || isAdministrator || isDeleting}
            aria-haspopup="dialog"
            onClick={() => {
              setDeleteError(null);
              setIsConfirmingDelete(true);
            }}
          >
            Eliminar mi cuenta
          </button>
        </div>
      </section>
      {isConfirmingDelete && user && (
        <ConfirmDialog
          title="¿Eliminar tu cuenta?"
          description={`Se eliminarán permanentemente la cuenta ${user.email}, tus datos personales, tu progreso y tus solicitudes. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar cuenta"
          pendingLabel="Eliminando cuenta…"
          isConfirming={isDeleting}
          error={deleteError}
          onCancel={() => {
            if (isDeleting) return;
            setIsConfirmingDelete(false);
            setDeleteError(null);
          }}
          onConfirm={() => void handleDeleteAccount()}
        />
      )}
    </section>
  );
}
