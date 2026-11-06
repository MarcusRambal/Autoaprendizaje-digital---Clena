import './HelpRequestManager.css';
import { useState, type FormEvent } from 'react';
import type { HelpRequest, RequestStatus } from '../../../types/contracts';

const initialRequests: HelpRequest[] = [
  {
    id: 1,
    requesterName: 'María López',
    topic: 'Correo electrónico',
    date: '2026-10-28',
    status: 'Pendiente'
  },
  {
    id: 2,
    requesterName: 'José Ramírez',
    topic: 'Navegación web',
    date: '2026-10-29',
    status: 'En Atención'
  },
  {
    id: 3,
    requesterName: 'Elena Torres',
    topic: 'Redes Sociales',
    date: '2026-10-30',
    status: 'Resuelta'
  }
];

const requestStatuses: RequestStatus[] = ['Pendiente', 'En Atención', 'Resuelta'];

const formatDate = (date: string) => {
  const parsedDate = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsedDate.getTime())
    ? date
    : new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(parsedDate);
};

export const HelpRequestManager = () => {
  const [requests, setRequests] = useState<HelpRequest[]>(initialRequests);
  const [requesterName, setRequesterName] = useState('');
  const [topic, setTopic] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreateRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = requesterName.trim();
    const trimmedTopic = topic.trim();

    if (!trimmedName || !trimmedTopic) {
      setFormError('Completa el nombre del solicitante y el tema.');
      return;
    }

    setRequests(current => [
      ...current,
      {
        id: current.reduce((maxId, request) => Math.max(maxId, request.id), 0) + 1,
        requesterName: trimmedName,
        topic: trimmedTopic,
        date: new Date().toISOString().slice(0, 10),
        status: 'Pendiente'
      }
    ]);
    setRequesterName('');
    setTopic('');
    setFormError(null);
  };

  const handleStatusChange = (requestId: number, status: RequestStatus) => {
    setRequests(current => current.map(request =>
      request.id === requestId ? { ...request, status } : request
    ));
  };

  const handleDeleteRequest = (requestId: number) => {
    setRequests(current => current.filter(request => request.id !== requestId));
  };

  return (
    <section className="help-request-manager">
      <header>
        <h1>Solicitudes de ayuda</h1>
        <p>Registra y administra las solicitudes de los usuarios.</p>
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
              setFormError(null);
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
              setFormError(null);
            }}
            placeholder="Ej. Correo electrónico"
          />
        </label>
        {formError && <p className="request-error" role="alert">{formError}</p>}
        <button type="submit">Registrar solicitud</button>
      </form>

      <section aria-labelledby="requests-list-title">
        <h2 id="requests-list-title">Solicitudes actuales</h2>
        {requests.length > 0 ? (
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
                          if (status) handleStatusChange(request.id, status);
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
                        onClick={() => handleDeleteRequest(request.id)}
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
      </section>
    </section>
  );
};
