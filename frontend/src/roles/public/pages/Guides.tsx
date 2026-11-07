import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Guides.css';

interface PublicGuide {
  id: number;
  title: string;
  description: string;
  category: string;
  file: string;
}

const guides: PublicGuide[] = [
  {
    id: 1,
    title: 'Navegación segura en internet',
    description: 'Aquí aprenderás cómo navegar de forma segura en internet.',
    category: 'Seguridad digital',
    file: 'guia1.pdf',
  },
  {
    id: 2,
    title: 'Potencia tu búsqueda con Google Scholar',
    description: 'Aprende a usar Google Scholar para encontrar información de investigación científica.',
    category: 'Búsqueda en internet',
    file: 'guia2.pdf',
  },
  {
    id: 3,
    title: 'Cómo reconocer un mensaje sospechoso',
    description: 'Identifica mensajes inesperados y aprende a verificar quién los envió.',
    category: 'Seguridad digital',
    file: 'guia3.pdf',
  },
];

const getSelectedGuideId = (state: unknown): number | undefined => {
  if (!state || typeof state !== 'object' || !('selectedGuideId' in state)) return undefined;
  const { selectedGuideId } = state;
  return typeof selectedGuideId === 'number' ? selectedGuideId : undefined;
};

export const Guides = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const selectedGuideId = getSelectedGuideId(location.state);
  const selectedGuide = guides.find(guide => guide.id === selectedGuideId);
  const categories = [...new Set(guides.map(guide => guide.category))];
  const filteredGuides = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return guides.filter(guide =>
      (!category || guide.category === category)
      && (!normalizedQuery
        || `${guide.title} ${guide.description}`.toLocaleLowerCase().includes(normalizedQuery))
    );
  }, [category, query]);

  const openGuide = (guide: PublicGuide) => {
    navigate(location.pathname, { state: { selectedGuideId: guide.id } });
  };

  if (selectedGuide) {
    const pdfUrl = `/${encodeURIComponent(selectedGuide.file)}`;
    return (
      <section className="public-page guides-page" aria-labelledby="selected-guide-title">
        <header className="guide-detail-header">
          <h1 id="selected-guide-title">{selectedGuide.title}</h1>
          <a className="guide-download" href={pdfUrl} download={selectedGuide.file}>Descargar PDF</a>
        </header>
        <iframe
          className="guide-pdf-viewer"
          src={pdfUrl}
          title={`Guía en PDF: ${selectedGuide.title}`}
        />
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
      <p className="guides-note">Guías de demostración; el catálogo conectado al servidor aún está pendiente.</p>

      {filteredGuides.length > 0 ? (
        <div className="guides-catalog" aria-label="Catálogo de guías">
          {filteredGuides.map(guide => (
            <button
              className="guide-card"
              key={guide.id}
              type="button"
              onClick={() => openGuide(guide)}
            >
              <strong>{guide.title}</strong>
              <span>{guide.description}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="guides-empty" role="status">No se encontraron guías con esos filtros.</p>
      )}
    </section>
  );
};
