import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../../services/authState';
import {
  createHelpRequest,
  listMyHelpRequests,
} from '../../../../services/helpRequestsApi';
import type { HelpRequest, RequestStatus } from '../../../../types/contracts';
import { Pagination } from '../../../features/content-management/Pagination';
import './Help.css';

const formatDate = (date: string) => {
  const parsedDate = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsedDate.getTime())
    ? date
    : new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(parsedDate);
};

const statusClassNames: Record<RequestStatus, string> = {
  Pendiente: 'pending',
  'En Atención': 'in-progress',
  Atendida: 'attended',
  Cancelada: 'cancelled',
};

export const Help = () => {
  const { user, isAuthenticated, isLoading: isSessionLoading } = useAuth();
  const isPublicUser = isAuthenticated && user?.userRole === 'student';
  const [requesterName, setRequesterName] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRequests, setTotalRequests] = useState(0);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!isPublicUser) return;
    let active = true;
    let correctingPage = false;
    listMyHelpRequests(page)
      .then(response => {
        if (!active) return;
        const safeTotalPages = Math.max(1, response.totalPages);
        setTotalPages(safeTotalPages);
        setTotalRequests(response.total);
        if (page > safeTotalPages) {
          correctingPage = true;
          setPage(safeTotalPages);
          return;
        }
        setRequests(response.items);
      })
      .catch((reason: unknown) => {
        if (active) {
          setRequestsError(reason instanceof Error
            ? reason.message
            : 'No se pudieron cargar tus solicitudes. Inténtalo de nuevo.');
        }
      })
      .finally(() => {
        if (active && !correctingPage) setIsLoadingRequests(false);
      });

    return () => {
      active = false;
    };
  }, [isPublicUser, page, reload]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setNotice(null);
    setFormError(null);
    try {
      await createHelpRequest({
        requesterName: requesterName.trim(),
        topic: topic.trim(),
        description: description.trim(),
      });
      setRequesterName('');
      setTopic('');
      setDescription('');
      setNotice('Tu solicitud fue enviada. Podrás consultar aquí su estado.');
      setRequestsError(null);
      setIsLoadingRequests(true);
      setPage(1);
      setReload(current => current + 1);
    } catch (reason) {
      setFormError(reason instanceof Error
        ? reason.message
        : 'No se pudo enviar la solicitud. Inténtalo de nuevo.');
    } finally {
      setPending(false);
    }
  };

  const retryRequests = () => {
    setIsLoadingRequests(true);
    setRequestsError(null);
    setReload(current => current + 1);
  };

  if (isSessionLoading) {
    return (
      <section className="public-page help-page" aria-labelledby="help-title">
        <h1 id="help-title">Ayuda</h1>
        <p role="status">Comprobando tu sesión…</p>
      </section>
    );
  }

  if (!isPublicUser) {
    return (
      <section className="public-page help-page" aria-labelledby="help-title">
        <header className="help-header">
          <div>
            <p className="public-eyebrow">Estamos para ayudarte</p>
            <h1 id="help-title">Ayuda</h1>
            <p>El envío y seguimiento de solicitudes está disponible para usuarios con una cuenta iniciada.</p>
          </div>
        </header>
        {user?.userRole === 'staff' ? (
          <p>Para gestionar solicitudes, visita el <Link to="/Staff/Requests">panel del personal</Link>.</p>
        ) : user?.userRole === 'admin' ? (
          <p>El seguimiento de solicitudes está disponible desde la cuenta de usuario que realizó el envío.</p>
        ) : (
          <p><Link to="/login">Inicia sesión con tu cuenta de usuario</Link> para enviar y consultar solicitudes.</p>
        )}
        <p className="help-emergency">Para situaciones de emergencia, contacta a los servicios de emergencia locales.</p>
      </section>
    );
  }

  return (
    <section className="public-page help-page" aria-labelledby="help-title">
      <header className="help-header">
        <div>
          <p className="public-eyebrow">Estamos para ayudarte</p>
          <h1 id="help-title">Ayuda</h1>
          <p>Cuéntanos qué necesitas y el personal de CLENA podrá atenderte.</p>
        </div>
        <button className="public-button" type="submit" form="student-help-form" disabled={pending}>
          {pending ? 'Enviando…' : 'Enviar solicitud'}
        </button>
      </header>

      <form className="help-form" id="student-help-form" onSubmit={handleSubmit}>
        <label htmlFor="help-name">Nombre</label>
        <input
          id="help-name"
          name="name"
          type="text"
          autoComplete="name"
          value={requesterName}
          onChange={event => {
            setRequesterName(event.target.value);
            setFormError(null);
          }}
          required
          maxLength={100}
        />
        <label htmlFor="help-subject">Asunto</label>
        <input
          id="help-subject"
          name="subject"
          type="text"
          value={topic}
          onChange={event => {
            setTopic(event.target.value);
            setFormError(null);
          }}
          required
          minLength={3}
          maxLength={200}
        />
        <label htmlFor="help-description">¿En qué podemos ayudarte?</label>
        <textarea
          id="help-description"
          name="description"
          value={description}
          onChange={event => {
            setDescription(event.target.value);
            setFormError(null);
          }}
          required
          maxLength={1000}
        />
        <p className="help-disclaimer">La solicitud y los datos que compartas serán visibles para el personal encargado de atenderla.</p>
        {formError && <p className="help-status help-status--error" role="alert">{formError}</p>}
        {notice && <p className="help-status help-status--success" role="status" aria-live="polite">{notice}</p>}
      </form>

      <section className="help-requests" aria-labelledby="my-requests-title">
        <h2 id="my-requests-title">Mis solicitudes</h2>
        {requestsError && (
          <div className="help-status help-status--error" role="alert">
            <p>{requestsError}</p>
            <button type="button" onClick={retryRequests}>Reintentar</button>
          </div>
        )}
        {isLoadingRequests && <p role="status">Cargando tus solicitudes…</p>}
        {!isLoadingRequests && !requestsError && (
          <>
            <p className="help-request-count">
              Has enviado {totalRequests} {totalRequests === 1 ? 'solicitud' : 'solicitudes'}.
            </p>
            {requests.length ? (
              <>
                <ul className="help-request-list">
                  {requests.map(request => (
                    <li className="help-request-card" key={request.id}>
                      <div className="help-request-card__heading">
                        <h3>{request.topic}</h3>
                        <span className={`help-request-status help-request-status--${statusClassNames[request.status]}`}>
                          {request.status}
                        </span>
                      </div>
                      {request.description && <p>{request.description}</p>}
                      <time dateTime={request.date}>{formatDate(request.date)}</time>
                    </li>
                  ))}
                </ul>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  setPage={nextPage => {
                    setPage(nextPage);
                    setIsLoadingRequests(true);
                    setRequestsError(null);
                  }}
                  label="Páginas de mis solicitudes"
                />
              </>
            ) : (
              <p>Aún no has enviado solicitudes de ayuda.</p>
            )}
          </>
        )}
      </section>
      <p className="help-emergency">Para situaciones de emergencia, contacta a los servicios de emergencia locales.</p>
    </section>
  );
};
