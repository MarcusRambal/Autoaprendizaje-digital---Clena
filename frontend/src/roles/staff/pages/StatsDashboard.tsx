import './StatsDashboard.css';
import { useState } from 'react';
import type { DashboardStats } from '../../../../types/contracts';
import { initialStats } from '../demoData';

export const StatsDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>(initialStats);

  const handleSimulateActivity = () => {
    setStats(current => {
      const categoryIndex = current.topCategories.length > 0
        ? Math.floor(Math.random() * current.topCategories.length)
        : -1;
      const guideIndex = current.topGuides.length > 0
        ? Math.floor(Math.random() * current.topGuides.length)
        : -1;

      return {
        ...current,
        totalRequests: current.totalRequests + 1,
        topCategories: current.topCategories.map((item, index) =>
          index === categoryIndex ? { ...item, value: item.value + 1 } : item
        ),
        topGuides: current.topGuides.map((item, index) =>
          index === guideIndex ? { ...item, value: item.value + 1 } : item
        )
      };
    });
  };

  return (
    <section className="stats-dashboard">
      <header>
        <h1>Estadísticas</h1>
        <p role="status"><strong>Demostración:</strong> estas cifras son ejemplos, no actividad real de la plataforma.</p>
      </header>

      <div className="stats-summary">
        <article className="stats-card">
          <h2>Total de Solicitudes</h2>
          <p>{stats.totalRequests}</p>
        </article>
        <article className="stats-card">
          <h2>Solicitudes Resueltas</h2>
          <p>{stats.resolvedRequests}</p>
        </article>
      </div>

      <div className="stats-lists">
        <section className="stats-list" aria-labelledby="top-categories-title">
          <h2 id="top-categories-title">Temas más consultados</h2>
          {stats.topCategories.length > 0 ? (
            <ul>
              {stats.topCategories.map(item => (
                <li key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </li>
              ))}
            </ul>
          ) : <p>No hay temas registrados.</p>}
        </section>

        <section className="stats-list" aria-labelledby="top-guides-title">
          <h2 id="top-guides-title">Guías más vistas</h2>
          {stats.topGuides.length > 0 ? (
            <ul>
              {stats.topGuides.map(item => (
                <li key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </li>
              ))}
            </ul>
          ) : <p>No hay guías registradas.</p>}
        </section>
      </div>

      <p>El número de participantes y los fallos por lección estarán disponibles cuando se implemente el módulo de métricas.</p>
      <button type="button" onClick={handleSimulateActivity}>Simular Nueva Actividad</button>
    </section>
  );
};
