import './HelpRequestManager.css';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { HelpRequest, RequestStatus } from '../../../../types/contracts';
import {
  apiErrorMessage,
  createHelpRequest,
  deleteHelpRequest,
  listHelpRequests,
  updateHelpRequestStatus,
  type ApiHelpRequest,
  type ApiRequestStatus
} from '../../../../services/staffContentApi';

const requestStatuses: RequestStatus[] = ['Pendiente', 'En Atención', 'Atendida'];
const PAGE_SIZE = 20;

const uiStatuses: Record<ApiRequestStatus, RequestStatus> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En Atención',
  ATTENDED: 'Atendida'
};
const toUiStatus = (status: ApiRequestStatus): RequestStatus => uiStatuses[status];

const apiStatuses: Record<RequestStatus, ApiRequestStatus> = {
  Pendiente: 'PENDING',
  'En Atención': 'IN_PROGRESS',
  Atendida: 'ATTENDED'
};
const toApiStatus = (status: RequestStatus): ApiRequestStatus => apiStatuses[status];

const toHelpRequest = (request: ApiHelpRequest): HelpRequest => ({
  id: request.id,
  requesterName: request.requesterName ?? 'Sin nombre',
  topic: request.topic,
  date: request.date.slice(0, 10),
  status: toUiStatus(request.status)
});

const formatDate = (date: string) => {
  const parsedDate = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsedDate.getTime())
    ? date
    : new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(parsedDate);
};

export const HelpRequestManager = () => {
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [requesterName, setRequesterName] = useState('');
  const [topic, setTopic] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadRequests = useCallback(async (requestedPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await listHelpRequests(requestedPage, PAGE_SIZE);
      setRequests(result.items.map(toHelpRequest));
      setPage(result.page);
      setTotalPages(Math.max(1, result.totalPages));
    } catch (loadError) {
      setError(apiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void listHelpRequests(1, PAGE_SIZE)
      .then(result => {
        if (!active) return;
        setRequests(result.items.map(toHelpRequest));
        setPage(result.page);
        setTotalPages(Math.max(1, result.totalPages));
      })
      .catch(loadError => {
        if (active) setError(apiErrorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCreateRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = requesterName.trim();
    const trimmedTopic = topic.trim();

    if (!trimmedName || !trimmedTopic) {
      setError('Completa el nombre del solicitante y el tema.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createHelpRequest({ requesterName: trimmedName, topic: trimmedTopic });
      setRequesterName('');
      setTopic('');
      await loadRequests(1);
    } catch (createError) {
      setError(apiErrorMessage(createError));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (requestId: HelpRequest['id'], status: RequestStatus) => {
    setError(null);
    try {
      const updated = await updateHelpRequestStatus(String(requestId), toApiStatus(status));
      setRequests(current => current.map(request =>
        request.id === requestId ? toHelpRequest(updated) : request
      ));
    } catch (updateError) {
      setError(apiErrorMessage(updateError));
    }
  };

  const handleDeleteRequest = async (requestId: HelpRequest['id']) => {
    setError(null);
    try {
      await deleteHelpRequest(String(requestId));
      await loadRequests(page);
    } catch (deleteError) {
      setError(apiErrorMessage(deleteError));
    }
  };

  return (
    <section className="help-request-manager">
      <header>
        <h1>Solicitudes de ayuda</h1>
        <p>Consulta y gestiona las solicitudes registradas en la plataforma.</p>
      </header>

      <form className="request-form" onSubmit={handleCreateRequest}>
        <h2>Registrar Nueva Solicitud</h2>
        <label>
          Nombre del solicitante
          <input
            type="text"
            value={requesterName}
            onChange={event => {
              setRequesterName(event.target.value);
              setError(null);
            }}
            placeholder="Nombre"
          />
        </label>
        <label>
          Tema de ayuda
          <input
            type="text"
            value={topic}
            onChange={event => {
              setTopic(event.target.value);
              setError(null);
            }}
            placeholder="Ej. Correo electrónico"
          />
        </label>
        {error && <p className="request-error" role="alert">{error}</p>}
        <button type="submit" disabled={saving}>{saving ? 'Registrando…' : 'Registrar solicitud'}</button>
      </form>

      <section aria-labelledby="requests-list-title">
        <h2 id="requests-list-title">Solicitudes actuales</h2>
        {loading ? <p role="status">Cargando solicitudes…</p> : requests.length > 0 ? (
          <div className="request-table-wrapper" role="region" aria-label="Tabla de solicitudes" tabIndex={0}>
            <table className="request-table">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Solicitante</th>
                  <th scope="col">Tema</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(request => (
                  <tr key={request.id}>
                    <td>{request.id}</td>
                    <td>{request.requesterName}</td>
                    <td>{request.topic}</td>
                    <td><time dateTime={request.date}>{formatDate(request.date)}</time></td>
                    <td>
                      <select
                        value={request.status}
                        aria-label={`Estado de solicitud ${request.id}`}
                        onChange={event => {
                          const status = requestStatuses.find(value => value === event.target.value);
                          if (status) void handleStatusChange(request.id, status);
                        }}
                      >
                        {requestStatuses.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => void handleDeleteRequest(request.id)}
                        aria-label={`Eliminar solicitud ${request.id}`}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p>No hay solicitudes registradas.</p>}
        {!loading && totalPages > 1 && (
          <nav className="request-pagination" aria-label="Páginas de solicitudes">
            <button type="button" disabled={page <= 1} onClick={() => void loadRequests(page - 1)}>
              Anterior
            </button>
            <span aria-live="polite">Página {page} de {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => void loadRequests(page + 1)}>
              Siguiente
            </button>
          </nav>
        )}
      </section>
    </section>
  );
};
