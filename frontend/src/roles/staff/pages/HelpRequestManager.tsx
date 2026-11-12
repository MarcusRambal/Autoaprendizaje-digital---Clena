import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import {
  createHelpRequest,
  deleteHelpRequest,
  listHelpRequests,
  updateHelpRequestStatus,
  type HelpRequestFilters,
  type HelpRequestStatusCode,
} from '../../../../services/helpRequestsApi';
import type { HelpRequest, RequestStatus } from '../../../../types/contracts';
import { Pagination } from '../../../features/content-management/Pagination';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import './HelpRequestManager.css';

const managedStatuses: Array<{
  code: HelpRequestStatusCode;
  label: RequestStatus;
}> = [
  { code: 'PENDING', label: 'Pendiente' },
  { code: 'IN_PROGRESS', label: 'En Atención' },
  { code: 'ATTENDED', label: 'Atendida' },
];

const formatDate = (date: string) => {
  const parsedDate = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsedDate.getTime())
    ? date
    : new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(parsedDate);
};

const initialFilters = (): HelpRequestFilters => ({
  page: 1,
  status: '',
  requester: '',
  date: '',
});

const HelpRequestDescription = ({ description }: { description: string }) => {
  const descriptionId = useId();
  const previewRef = useRef<HTMLParagraphElement>(null);
  const expandedRef = useRef(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;

    const checkTruncation = () => {
      if (expandedRef.current) return;
      const truncated = preview.scrollHeight > preview.clientHeight + 1;
      setIsTruncated(current => current === truncated ? current : truncated);
    };

    const observer = new ResizeObserver(checkTruncation);
    observer.observe(preview);
    checkTruncation();
    return () => observer.disconnect();
  }, [description]);

  useEffect(() => {
    if (isExpanded) return;
    const frame = requestAnimationFrame(() => {
      const preview = previewRef.current;
      if (preview) {
        setIsTruncated(preview.scrollHeight > preview.clientHeight + 1);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [isExpanded]);

  const toggleExpanded = () => {
    expandedRef.current = !isExpanded;
    setIsExpanded(current => !current);
  };

  return (
    <div className="request-description-disclosure">
      <p
        ref={previewRef}
        id={descriptionId}
        className={`request-description-preview${isExpanded ? ' is-expanded' : ''}`}
      >
        {description}
      </p>
      {isTruncated && (
        <button
          type="button"
          className="request-description-toggle"
          aria-expanded={isExpanded}
          aria-controls={descriptionId}
          onClick={toggleExpanded}
        >
          {isExpanded ? 'Mostrar menos' : 'Leer descripción completa'}
        </button>
      )}
    </div>
  );
};

export const HelpRequestManager = () => {
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [requesterName, setRequesterName] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteRequest, setPendingDeleteRequest] = useState<HelpRequest | null>(null);

  useEffect(() => {
    let active = true;
    let correctingPage = false;
    listHelpRequests({
      ...appliedFilters,
      page: filters.page,
    })
      .then(response => {
        if (!active) return;
        const safeTotalPages = Math.max(1, response.totalPages);
        setTotal(response.total);
        setTotalPages(safeTotalPages);
        if (filters.page > safeTotalPages) {
          correctingPage = true;
          setFilters(current => ({ ...current, page: safeTotalPages }));
          return;
        }
        setRequests(response.items);
      })
      .catch((reason: unknown) => {
        if (active) {
          setLoadError(reason instanceof Error
            ? reason.message
            : 'No se pudieron cargar las solicitudes. Inténtalo de nuevo.');
        }
      })
      .finally(() => {
        if (active && !correctingPage) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [appliedFilters, filters.page, reload]);

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setLoadError(null);
    setActionError(null);
    setAppliedFilters({ ...filters, page: 1 });
    setFilters(current => ({ ...current, page: 1 }));
  };

  const clearFilters = () => {
    const cleared = initialFilters();
    setFilters(cleared);
    setAppliedFilters(cleared);
    setIsLoading(true);
    setLoadError(null);
    setActionError(null);
  };

  const retryLoading = () => {
    setIsLoading(true);
    setLoadError(null);
    setReload(current => current + 1);
  };

  const reloadRequests = () => {
    setIsLoading(true);
    setLoadError(null);
    setReload(current => current + 1);
  };

  const handleCreateRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isCreating) return;
    setIsCreating(true);
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
      setAppliedFilters(initialFilters());
      setFilters(initialFilters());
      setActionError(null);
      reloadRequests();
    } catch (reason) {
      setFormError(reason instanceof Error
        ? reason.message
        : 'No se pudo registrar la solicitud. Inténtalo de nuevo.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusChange = async (
    requestId: string,
    status: HelpRequestStatusCode,
  ) => {
    setUpdatingId(requestId);
    setActionError(null);
    try {
      await updateHelpRequestStatus(requestId, status);
      reloadRequests();
    } catch (reason) {
      setActionError(reason instanceof Error
        ? reason.message
        : 'No se pudo actualizar el estado. Inténtalo de nuevo.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteRequest = (request: HelpRequest) => {
    setActionError(null);
    setPendingDeleteRequest(request);
  };

  const confirmDeleteRequest = async () => {
    const request = pendingDeleteRequest;
    if (!request || deletingId !== null) return;
    const requestId = String(request.id);
    setDeletingId(requestId);
    setActionError(null);
    try {
      await deleteHelpRequest(requestId);
      setPendingDeleteRequest(null);
      reloadRequests();
    } catch (reason) {
      setActionError(reason instanceof Error
        ? reason.message
        : 'No se pudo eliminar la solicitud. Inténtalo de nuevo.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="help-request-manager">
      <header>
        <h1>Solicitudes de ayuda</h1>
        <p>Consulta, filtra y atiende las solicitudes registradas.</p>
      </header>

      <section aria-labelledby="requests-list-title">
        <h2 id="requests-list-title">Solicitudes registradas</h2>
        <form className="request-filters" onSubmit={applyFilters}>
          <label>
            Buscar por solicitante
            <input
              type="search"
              value={filters.requester}
              onChange={event => setFilters(current => ({
                ...current,
                requester: event.target.value,
              }))}
              placeholder="Nombre o correo"
              maxLength={100}
            />
          </label>
          <label>
            Estado
            <select
              value={filters.status}
              onChange={event => {
                const status = managedStatuses.find(
                  option => option.code === event.target.value,
                );
                setFilters(current => ({
                  ...current,
                  status: status?.code ?? '',
                }));
              }}
            >
              <option value="">Todos los estados</option>
              {managedStatuses.map(status => (
                <option key={status.code} value={status.code}>{status.label}</option>
              ))}
            </select>
          </label>
          <label>
            Fecha
            <input
              type="date"
              value={filters.date}
              onChange={event => setFilters(current => ({
                ...current,
                date: event.target.value,
              }))}
            />
          </label>
          <div className="request-filter-actions">
            <button type="submit">Aplicar filtros</button>
            <button type="button" className="request-secondary-button" onClick={clearFilters}>
              Limpiar
            </button>
          </div>
        </form>

        {actionError && !pendingDeleteRequest && <p className="request-error" role="alert">{actionError}</p>}
        {loadError && (
          <div className="request-error" role="alert">
            <p>{loadError}</p>
            <button type="button" onClick={retryLoading}>Reintentar</button>
          </div>
        )}
        {isLoading && <p role="status">Cargando solicitudes…</p>}
        {!isLoading && !loadError && (
          <>
            <p className="request-result-count">
              Se encontraron {total} {total === 1 ? 'solicitud' : 'solicitudes'}.
            </p>
            {requests.length > 0 ? (
              <>
                <div className="request-table-wrapper" role="region" aria-label="Tabla de solicitudes" tabIndex={0}>
                  <table className="request-table">
                    <thead>
                      <tr>
                        <th scope="col">Solicitante</th>
                        <th scope="col">Tema y descripción</th>
                        <th scope="col">Fecha</th>
                        <th scope="col">Estado</th>
                        <th scope="col">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map(request => {
                        const requestId = String(request.id);
                        const disabled = Boolean(updatingId || deletingId);
                        const isCancelled = request.status === 'Cancelada';
                        return (
                          <tr key={requestId}>
                            <td>
                              <strong>{request.requesterName || 'Sin nombre'}</strong>
                              {request.requesterEmail && <span className="requester-email">{request.requesterEmail}</span>}
                            </td>
                            <td>
                              <strong>{request.topic}</strong>
                              {request.description && (
                                <HelpRequestDescription description={request.description} />
                              )}
                            </td>
                            <td><time dateTime={request.date}>{formatDate(request.date)}</time></td>
                            <td>
                              <select
                                value={managedStatuses.find(status => status.label === request.status)?.code ?? 'CANCELLED'}
                                aria-label={`Estado de solicitud ${requestId}`}
                                disabled={disabled || isCancelled}
                                onChange={event => {
                                  const status = managedStatuses.find(value => value.code === event.target.value);
                                  if (status) void handleStatusChange(requestId, status.code);
                                }}
                              >
                                {isCancelled && <option value="CANCELLED">Cancelada</option>}
                                {managedStatuses.map(status => (
                                  <option key={status.code} value={status.code}>{status.label}</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() => void handleDeleteRequest(request)}
                                aria-label={`Eliminar solicitud de ${request.requesterName ?? 'persona solicitante'}`}
                              >
                                {deletingId === requestId ? 'Eliminando…' : 'Eliminar'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={filters.page}
                  totalPages={totalPages}
                  setPage={page => {
                    setFilters(current => ({ ...current, page }));
                    setIsLoading(true);
                    setLoadError(null);
                  }}
                  label="Páginas de solicitudes"
                />
              </>
            ) : (
              <p role="status">No se encontraron solicitudes con esos filtros.</p>
            )}
          </>
        )}
      </section>

      <form className="request-form" onSubmit={handleCreateRequest}>
        <h2>Registrar nueva solicitud</h2>
        <label>
          Nombre del solicitante
          <input
            type="text"
            value={requesterName}
            onChange={event => {
              setRequesterName(event.target.value);
              setFormError(null);
            }}
            placeholder="Nombre"
            maxLength={100}
            required
          />
        </label>
        <label>
          Tema de ayuda
          <input
            type="text"
            value={topic}
            onChange={event => {
              setTopic(event.target.value);
              setFormError(null);
            }}
            placeholder="Ej. Correo electrónico"
            minLength={3}
            maxLength={200}
            required
          />
        </label>
        <label className="request-form__description">
          Descripción de la necesidad
          <textarea
            value={description}
            onChange={event => {
              setDescription(event.target.value);
              setFormError(null);
            }}
            maxLength={1000}
            required
          />
        </label>
        {formError && <p className="request-error" role="alert">{formError}</p>}
        <button type="submit" disabled={isCreating}>
          {isCreating ? 'Registrando…' : 'Registrar solicitud'}
        </button>
      </form>
      {pendingDeleteRequest && (
        <ConfirmDialog
          title="¿Eliminar esta solicitud?"
          description={`Se eliminará la solicitud de ${pendingDeleteRequest.requesterName ?? 'la persona solicitante'}. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar solicitud"
          pendingLabel="Eliminando solicitud…"
          isConfirming={deletingId === String(pendingDeleteRequest.id)}
          error={actionError}
          onCancel={() => {
            if (deletingId !== null) return;
            setPendingDeleteRequest(null);
            setActionError(null);
          }}
          onConfirm={() => void confirmDeleteRequest()}
        />
      )}
    </section>
  );
};
