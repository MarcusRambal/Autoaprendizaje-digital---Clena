import { usePublicRequest } from '../../../../services/publicLearning';
import { getMyProgress } from '../../../../services/progressApi';
import './Progress.css';

export const Progress = () => {
  const { data: progress, isLoading, error } = usePublicRequest(getMyProgress);
  const progressSections = progress
    ? [
        {
          title: 'Guías',
          label: 'guías',
          completed: progress.guides.completed,
          total: progress.guides.total,
          value: progress.guides.percentage,
          tone: 'guides' as const,
        },
        {
          title: 'Lecciones',
          label: 'lecciones',
          completed: progress.lessons.completed,
          total: progress.lessons.total,
          value: progress.lessons.percentage,
          tone: 'lessons' as const,
        },
      ]
    : null;

  return (
    <section className="public-page progress-page" aria-labelledby="progress-title">
      <header className="progress-header">
        <p className="public-eyebrow">Tu aprendizaje</p>
        <h1 id="progress-title">Mi progreso</h1>
        <p>Un resumen de lo que has recorrido en CLENA.</p>
      </header>
      {isLoading && <p role="status">Cargando progreso…</p>}
      {error && <p className="public-error" role="alert">{error}</p>}
      {!isLoading && !error && progressSections && (
        <div className="progress-sections">
          {progressSections.map(section => (
            <article className={`progress-card progress-card--${section.tone}`} key={section.title}>
              <div className="progress-card-heading">
                <h2>{section.title}</h2>
                <strong>{section.value}%</strong>
              </div>
              <progress value={section.value} max="100" aria-label={`${section.value}% completado de ${section.label}`}>
                {section.value}%
              </progress>
              <p>Has completado {section.completed} de {section.total} {section.label}.</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
