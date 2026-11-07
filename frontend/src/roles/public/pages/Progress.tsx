import { usePublicRequest, mockPublicLearningService } from '../../../../services/publicLearning';
import './Progress.css';

export const Progress = () => {
  const { data: progressSections, isLoading, error } = usePublicRequest(mockPublicLearningService.getProgress);

  return (
    <section className="public-page progress-page" aria-labelledby="progress-title">
      <header className="progress-header">
        <p className="public-eyebrow">Tu aprendizaje</p>
        <h1 id="progress-title">Mi progreso</h1>
        <p>Un resumen de lo que has recorrido en CLENA.</p>
      </header>
      <p className="public-demo-note" role="note">Datos de demostración. Tu avance real todavía no se guarda.</p>
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
              <p>Has completado el {section.value}% de {section.label}.</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
