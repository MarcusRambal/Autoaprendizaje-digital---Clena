import './StatsDashboard.css';
import { useEffect, useState, type FormEvent } from 'react';
import {
  getStatistics,
  type Statistics,
  type StatisticsRange,
} from '../../../../services/statsApi';

function bogotaDate(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function statisticsError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'No se pudieron cargar las estadísticas.';
  }
  const details = error as Record<string, unknown>;
  const status =
    typeof details.statusCode === 'number'
      ? details.statusCode
      : details.status;
  if (status === 401) return 'Sesión expirada.';
  if (status === 403) return 'Solo staff/admin puede consultar las estadísticas.';
  return 'No se pudieron cargar las estadísticas.';
}

const today = bogotaDate(new Date());
const initialRange = { from: addDays(today, -29), to: today };

export const StatsDashboard = () => {
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [range, setRange] = useState<StatisticsRange>(initialRange);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getStatistics(range)
      .then(result => {
        if (active) setStatistics(result);
      })
      .catch((reason: unknown) => {
        if (active) setError(statisticsError(reason));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [range]);

  const applyRange = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (from > to) {
      setRangeError('La fecha inicial debe ser anterior o igual a la fecha final.');
      return;
    }
    setRangeError(null);
    setLoading(true);
    setError(null);
    setRange({ from, to });
  };

  return (
    <section className="stats-dashboard" aria-labelledby="statistics-title">
      <header>
        <h1 id="statistics-title">Estadísticas</h1>
        <p>Consultas de guías y solicitudes de ayuda por rango de fechas.</p>
      </header>

      <form className="stats-range-form" onSubmit={applyRange}>
        <div className="stats-range-field">
          <label htmlFor="stats-from">Desde</label>
          <input
            id="stats-from"
            type="date"
            required
            value={from}
            onChange={event => setFrom(event.target.value)}
          />
        </div>
        <div className="stats-range-field">
          <label htmlFor="stats-to">Hasta</label>
          <input
            id="stats-to"
            type="date"
            required
            value={to}
            onChange={event => setTo(event.target.value)}
          />
        </div>
        <button type="submit">Consultar</button>
      </form>

      {rangeError && <p className="stats-error" role="alert">{rangeError}</p>}
      {error && <p className="stats-error" role="alert">{error}</p>}
      {loading && <p role="status">Cargando estadísticas…</p>}
      {!loading && !error && statistics && (
        <>
          <p role="status">
            Rango: {statistics.range.from} a {statistics.range.to}
          </p>
          <div className="stats-summary">
            <article className="stats-card">
              <h2>Total de solicitudes de ayuda</h2>
              <p>{statistics.helpRequests.total}</p>
            </article>
            <article className="stats-card">
              <h2>Solicitudes atendidas</h2>
              <p>{statistics.helpRequests.attended}</p>
            </article>
          </div>

          <div className="stats-lists">
            <section className="stats-list" aria-labelledby="top-guides-title">
              <h2 id="top-guides-title">Guías más vistas</h2>
              {statistics.topGuides.length ? (
                <div className="stats-table-scroll">
                  <table className="stats-data-table">
                    <thead>
                      <tr><th>Guía</th><th>Categoría</th><th>Vistas</th></tr>
                    </thead>
                    <tbody>
                      {statistics.topGuides.map(guide => (
                        <tr key={guide.id}>
                          <td>{guide.title}</td>
                          <td>{guide.categoryTitle}</td>
                          <td>{guide.views}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p>No hay guías consultadas en este rango.</p>}
            </section>

            <section className="stats-list" aria-labelledby="top-categories-title">
              <h2 id="top-categories-title">Categorías más consultadas</h2>
              {statistics.topCategories.length ? (
                <div className="stats-table-scroll">
                  <table className="stats-data-table">
                    <thead>
                      <tr><th>Categoría</th><th>Vistas</th></tr>
                    </thead>
                    <tbody>
                      {statistics.topCategories.map(category => (
                        <tr key={category.id}>
                          <td>{category.title}</td>
                          <td>{category.views}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p>No hay categorías consultadas en este rango.</p>}
            </section>
          </div>
        </>
      )}
    </section>
  );
};
