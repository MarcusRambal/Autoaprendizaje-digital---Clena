import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { matchesSearch } from '../../../features/content-management/searchContent';
import { usePublicRequest, type PublicGuide } from '../../../../services/publicLearning';
import { getPublicGuides } from '../../../../services/publicGuideApi';
import './Guides.css';

const getSelectedGuideId = (state: unknown): number | string | undefined => {
  if (!state || typeof state !== 'object' || !('selectedGuideId' in state)) return undefined;
  const { selectedGuideId } = state;
  return typeof selectedGuideId === 'number' || typeof selectedGuideId === 'string'
    ? selectedGuideId
    : undefined;
};

export const Guides = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: guides, isLoading, error } = usePublicRequest(getPublicGuides);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const selectedGuideId = getSelectedGuideId(location.state);
  const selectedGuide = guides?.find(guide => guide.id === selectedGuideId);
  const categories = [...new Set((guides ?? []).map(guide => guide.category))];
  const filteredGuides = useMemo(() => (guides ?? []).filter(guide =>
      (!category || guide.category === category)
      && matchesSearch(query, guide.title, guide.description, guide.category)
    ), [category, guides, query]);

  const openGuide = (guide: PublicGuide) => {
    navigate(location.pathname, { state: { selectedGuideId: guide.id } });
  };

  if (selectedGuide) {
    const pdfUrl = selectedGuide.fileUrl;
    return (
      <section className="public-page guides-page" aria-labelledby="selected-guide-title">
        <header className="guide-detail-header">
          <div>
            <p className="public-eyebrow">{selectedGuide.category}</p>
            <h1 id="selected-guide-title">{selectedGuide.title}</h1>
          </div>
          <div className="guide-detail-actions">
              <button
                type="button"
                className="public-button public-button--secondary"
                onClick={() => navigate(location.pathname, { replace: true, state: null })}
              >
                Volver a las guías
              </button>
              {pdfUrl && (
                <>
                  <a className="public-button" href={pdfUrl} download={selectedGuide.file || undefined}>
                    Descargar PDF
                  </a>
                  <a className="guide-open-link" href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    Abrir PDF en otra pestaña
                  </a>
                </>
              )}
          </div>
        </header>
        {selectedGuide.description && <p className="guide-description">{selectedGuide.description}</p>}
        {pdfUrl ? (
          <iframe
            className="guide-pdf-viewer"
            src={pdfUrl}
            title={`Guía en PDF: ${selectedGuide.title}`}
          />
        ) : <p role="status">Esta guía todavía no tiene un PDF disponible.</p>}
      </section>
    );
  }

  return (
    <section className="public-page guides-page" aria-labelledby="guides-title">
      <header className="guides-catalog-header">
        <h1 id="guides-title">Guías de aprendizaje</h1>
        <div className="guides-filters">
          <label className="visually-hidden" htmlFor="guide-search">Buscar guías por nombre</label>
          <input
            id="guide-search"
            type="search"
            placeholder="Búsqueda por nombre"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
          <label className="visually-hidden" htmlFor="guide-category">Filtrar guías por categoría</label>
          <select
            id="guide-category"
            value={category}
            onChange={event => setCategory(event.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </header>
      {isLoading && <p role="status">Cargando guías…</p>}
      {error && <p className="public-error" role="alert">{error}</p>}

      {!isLoading && !error && filteredGuides.length > 0 ? (
        <div className="guides-catalog" aria-label="Catálogo de guías">
          {filteredGuides.map(guide => (
            <button
              className="guide-card"
              key={guide.id}
              type="button"
              onClick={() => openGuide(guide)}
            >
              <strong>{guide.title}</strong>
              <span>{guide.category}</span>
            </button>
          ))}
        </div>
      ) : !isLoading && !error ? (
        <p className="guides-empty" role="status">No se encontraron guías con esos filtros.</p>
      ) : null}
    </section>
  );
};
