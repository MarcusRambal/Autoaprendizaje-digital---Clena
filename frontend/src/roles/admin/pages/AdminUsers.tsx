import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  createUser,
  deleteUserAccount,
  listUserAccounts,
  type CreatableUserRole,
  type UserAccount,
  type UserAccountFilters,
} from '../../../../services/usersApi';
import { Pagination } from '../../../features/content-management/Pagination';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import './AdminPages.css';

const roleLabels = {
  ADMIN: 'Administrador',
  STAFF: 'Personal',
  PUBLIC_USER: 'Usuario público',
} as const;

const statusLabels = {
  ACTIVE: 'Activa',
  DISABLED: 'Deshabilitada',
  ARCHIVED: 'Archivada',
} as const;

function formatCreatedAt(value: string): string {
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(
    new Date(value),
  );
}

function getCreateUserError(error: unknown): {
  message: string;
  field?: 'email' | 'password' | 'role';
} {
  const details =
    error && typeof error === 'object'
      ? (error as Record<string, unknown>)
      : {};
  const statusCode =
    typeof details.statusCode === 'number'
      ? details.statusCode
      : typeof details.status === 'number'
        ? details.status
        : undefined;
  const code = typeof details.code === 'string' ? details.code : undefined;

  if (statusCode === 409 && code === 'EMAIL_ALREADY_REGISTERED') {
    return { message: 'Ya existe una cuenta con ese correo.', field: 'email' };
  }
  if (statusCode === 400 && code === 'INVALID_ROLE') {
    return { message: 'El rol seleccionado no es válido.', field: 'role' };
  }
  if (statusCode === 400 && code === 'WEAK_PASSWORD') {
    return {
      message: 'La contraseña debe tener al menos 8 caracteres y máximo 72 bytes.',
      field: 'password',
    };
  }
  if (statusCode === 400 && code === 'INVALID_AUTH_INPUT') {
    return { message: 'Revisa el correo y la contraseña.', field: 'email' };
  }
  if (statusCode === 401) {
    return { message: 'Tu sesión expiró. Vuelve a iniciar sesión.' };
  }
  if (statusCode === 403) {
    return { message: 'Solo un administrador puede crear usuarios.' };
  }
  return { message: 'No se pudo crear el usuario.' };
}

export function AdminUsers() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<CreatableUserRole>('PUBLIC_USER');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const emailInput = useRef<HTMLInputElement>(null);
  const passwordInput = useRef<HTMLInputElement>(null);
  const roleInput = useRef<HTMLSelectElement>(null);

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<UserAccountFilters>({
    page: 1,
    search: '',
    role: '',
  });
  const [emailFilter, setEmailFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserAccountFilters['role']>('');
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<UserAccount | null>(null);
  const [reloadList, setReloadList] = useState(0);

  useEffect(() => {
    let active = true;
    listUserAccounts(filters)
      .then(response => {
        if (!active) return;
        if (filters.page > response.totalPages) {
          setFilters(current => ({ ...current, page: response.totalPages }));
          return;
        }
        setUsers(response.items);
        setTotalUsers(response.total);
        setTotalPages(response.totalPages);
      })
      .catch((reason: unknown) => {
        if (active) {
          setListError(reason instanceof Error
            ? reason.message
            : 'No se pudieron cargar las cuentas de usuario. Inténtalo de nuevo.');
        }
      })
      .finally(() => {
        if (active) setListLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters, reloadList]);

  const searchUsers = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setListLoading(true);
    setListError(null);
    setDeleteError(null);
    setDeleteSuccess(null);
    setFilters({
      page: 1,
      search: emailFilter.trim(),
      role: roleFilter,
    });
    setReloadList(current => current + 1);
  };

  const clearFilters = () => {
    setEmailFilter('');
    setRoleFilter('');
    setListLoading(true);
    setListError(null);
    setDeleteError(null);
    setDeleteSuccess(null);
    setFilters({ page: 1, search: '', role: '' });
    setReloadList(current => current + 1);
  };

  const goToPage = (page: number) => {
    setListLoading(true);
    setListError(null);
    setFilters(current => ({ ...current, page }));
  };

  const retryList = () => {
    setListLoading(true);
    setListError(null);
    setReloadList(current => current + 1);
  };

  const removeUser = (user: UserAccount) => {
    setDeleteError(null);
    setDeleteSuccess(null);
    setPendingDeleteUser(user);
  };

  const confirmRemoveUser = async () => {
    const user = pendingDeleteUser;
    if (!user || deletingId) return;
    setDeletingId(user.id);
    setDeleteError(null);
    setDeleteSuccess(null);
    try {
      await deleteUserAccount(user.id);
      setDeleteSuccess(`Se eliminó la cuenta de ${user.email}.`);
      setPendingDeleteUser(null);
      setListLoading(true);
      setReloadList(current => current + 1);
    } catch (reason) {
      setDeleteError(reason instanceof Error
        ? reason.message
        : 'No se pudo eliminar la cuenta. Inténtalo de nuevo.');
    } finally {
      setDeletingId(null);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (creating) return;
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const createdUser = await createUser({
        email: email.trim().toLowerCase(),
        password,
        role,
      });
      setSuccess(`Usuario creado: ${createdUser.email}`);
      setEmail('');
      setPassword('');
      setRole('PUBLIC_USER');
      setListError(null);
      setListLoading(true);
      setReloadList(current => current + 1);
    } catch (reason: unknown) {
      const failure = getCreateUserError(reason);
      setError(failure.message);
      if (failure.field === 'email') emailInput.current?.focus();
      if (failure.field === 'password') passwordInput.current?.focus();
      if (failure.field === 'role') roleInput.current?.focus();
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="admin-page" aria-labelledby="users-title">
      <header>
        <p className="admin-page-eyebrow">Administración</p>
        <h1 id="users-title">Administrar usuarios</h1>
        <p>Consulta, busca y elimina cuentas de usuario del sistema.</p>
      </header>

      <section className="user-directory" aria-labelledby="user-directory-title">
        <header>
          <h2 id="user-directory-title">Cuentas registradas</h2>
          <p>La búsqueda por correo y el filtro por rol se aplican en el servidor.</p>
        </header>
        <form className="user-filter-form" onSubmit={searchUsers}>
          <div className="user-filter-field">
            <label htmlFor="user-email-filter">Buscar por correo electrónico</label>
            <input
              id="user-email-filter"
              type="search"
              maxLength={100}
              value={emailFilter}
              onChange={event => setEmailFilter(event.target.value)}
              placeholder="nombre@ejemplo.com"
            />
          </div>
          <div className="user-filter-field">
            <label htmlFor="user-role-filter">Filtrar por rol</label>
            <select
              id="user-role-filter"
              value={roleFilter}
              onChange={event => setRoleFilter(
                event.target.value === 'ADMIN' ||
                  event.target.value === 'STAFF' ||
                  event.target.value === 'PUBLIC_USER'
                  ? event.target.value
                  : '',
              )}
            >
              <option value="">Todos los roles</option>
              <option value="ADMIN">Administrador</option>
              <option value="STAFF">Personal</option>
              <option value="PUBLIC_USER">Usuario público</option>
            </select>
          </div>
          <div className="user-filter-actions">
            <button type="submit">Buscar</button>
            <button type="button" className="user-filter-clear" onClick={clearFilters}>
              Limpiar filtros
            </button>
          </div>
        </form>

        {listError && (
          <div className="admin-form-error" role="alert">
            <p>{listError}</p>
            <button type="button" onClick={retryList}>Reintentar</button>
          </div>
        )}
        {!pendingDeleteUser && deleteError && <p className="admin-form-error" role="alert">{deleteError}</p>}
        {deleteSuccess && <p className="admin-form-success" role="status">{deleteSuccess}</p>}
        {listLoading ? (
          <p role="status">Cargando cuentas de usuario…</p>
        ) : listError ? null : users.length > 0 ? (
          <>
            <p className="user-directory-count">
              Se encontraron {totalUsers} {totalUsers === 1 ? 'cuenta' : 'cuentas'}.
            </p>
            <ul className="user-account-list">
              {users.map(user => (
                <li className="user-account-card" key={user.id}>
                  <div className="user-account-details">
                    <strong>{user.email}</strong>
                    <span>Rol: {roleLabels[user.role]}</span>
                    <span>Estado: {statusLabels[user.status]}</span>
                    <span>Creada: {formatCreatedAt(user.createdAt)}</span>
                  </div>
                  {user.role === 'ADMIN' ? (
                    <span className="user-account-protected" title="Las cuentas de administrador están protegidas.">
                      Protegida
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="user-account-delete"
                      onClick={() => removeUser(user)}
                      disabled={deletingId === user.id}
                      aria-label={`Eliminar la cuenta de ${user.email}`}
                    >
                      {deletingId === user.id ? 'Eliminando…' : 'Eliminar'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <Pagination
              page={filters.page}
              totalPages={totalPages}
              setPage={goToPage}
              label="Páginas de cuentas de usuario"
            />
          </>
        ) : (
          <p role="status">No se encontraron cuentas con esos filtros.</p>
        )}
      </section>

      <section className="user-create-section" aria-labelledby="user-create-title">
        <h2 id="user-create-title">Crear cuenta de usuario</h2>
        <form className="admin-form" onSubmit={submit}>
          <label htmlFor="account-email">Correo electrónico</label>
          <input ref={emailInput} id="account-email" aria-label="Correo electrónico" type="email" autoComplete="off" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} />
          <label htmlFor="account-password">Contraseña inicial</label>
          <input ref={passwordInput} id="account-password" aria-label="Contraseña" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} aria-describedby="account-password-help" />
          <small id="account-password-help">Mínimo 8 caracteres y máximo 72 caracteres. Entrégala de forma segura.</small>
          <label htmlFor="account-role">Rol</label>
          <select ref={roleInput} id="account-role" value={role} onChange={event => setRole(event.target.value === 'STAFF' ? 'STAFF' : 'PUBLIC_USER')}>
            <option value="PUBLIC_USER">Usuario público</option>
            <option value="STAFF">Staff</option>
          </select>
          {error && <p className="admin-form-error" role="alert">{error}</p>}
          {success && <p className="admin-form-success" role="status">{success}</p>}
          <button type="submit" disabled={creating}>{creating ? 'Creando…' : 'Crear usuario'}</button>
        </form>
      </section>
      {pendingDeleteUser && (
        <ConfirmDialog
          title="¿Eliminar esta cuenta?"
          description={`Se eliminarán permanentemente la cuenta ${pendingDeleteUser.email}, sus datos personales, progreso y solicitudes. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar cuenta"
          pendingLabel="Eliminando cuenta…"
          isConfirming={deletingId === pendingDeleteUser.id}
          error={deleteError}
          onCancel={() => {
            if (deletingId) return;
            setPendingDeleteUser(null);
            setDeleteError(null);
          }}
          onConfirm={() => void confirmRemoveUser()}
        />
      )}
    </section>
  );
}
