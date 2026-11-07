import './Progress.css';

const progressSections = [
  { title: 'Guías', label: 'tus guías', value: 40, tone: 'guides' },
  { title: 'Lecciones', label: 'tus lecciones', value: 40, tone: 'lessons' },
];

export const Progress = () => (
  <section className="public-page progress-page" aria-labelledby="progress-title">
    <h1 id="progress-title">Progreso</h1>
    <div className="progress-sections">
      {progressSections.map(section => (
        <article className={`progress-card progress-card--${section.tone}`} key={section.title}>
          <h2>{section.title}</h2>
          <progress value={section.value} max="100" aria-label={`${section.value}% completado de ${section.label}`}>
            {section.value}%
          </progress>
          <p>¡Felicidades! Has completado el {section.value}% de {section.label}.</p>
        </article>
      ))}
    </div>
    <p className="progress-note">El avance mostrado es de ejemplo; el progreso real aún no se guarda.</p>
  </section>
);
