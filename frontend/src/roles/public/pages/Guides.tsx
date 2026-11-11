import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { listCategories } from '../../../../services/categoriesApi';
import {
  getPublicGuidePdf,
  listPublicGuides,
} from '../../../../services/guidesApi';
import type { Category, Guide } from '../../../../types/contracts';
import { Pagination } from '../../../features/content-management/Pagination';
import './Guides.css';

function isGuide(value: unknown): value is Guide {
  if (!value || typeof value !== 'object') return false;
  const guide = value as Record<string, unknown>;
  return (
    typeof guide.id === 'string' &&
    typeof guide.title === 'string' &&
    typeof guide.category === 'string' &&
    (typeof guide.file === 'string' || guide.file === null)
  );
}

const getSelectedGuide = (state: unknown): Guide | null => {
  if (!state || typeof state !== 'object' || !('selectedGuide' in state)) return null;
  return isGuide(state.selectedGuide) ? state.selectedGuide : null;
};

export const Guides = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedGuide = getSelectedGuide(location.state);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalGuides, setTotalGuides] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categoryReload, setCategoryReload] = useState(0);
  const [guideReload, setGuideReload] = useState(0);
  const [pdf, setPdf] = useState<{ id: string; url: string } | null>(null);
  const [pdfError, setPdfError] = useState<{ id: string; message: string } | null>(null);

  useEffect(() => {
    let active = true;
    listCategories()
      .then(items => {
        if (active) setCategories(items);
      })
      .catch((reason: unknown) => {
        if (active) {
          setCategoryError(reason instanceof Error
            ? reason.message
            : 'No se pudieron cargar las categorías.');
        }
      })
      .finally(() => {
        if (active) setCategoriesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [categoryReload]);

  useEffect(() => {
    if (selectedGuide) return;
    let active = true;
    let correctedPage = false;
    listPublicGuides({ page, search: query, categoryId })
      .then(response => {
        if (!active) return;
        setTotalGuides(response.total);
        const safeTotalPages = Math.max(1, response.totalPages);
        setTotalPages(safeTotalPages);
        if (page > safeTotalPages) {
          correctedPage = true;
          setPage(safeTotalPages);
          return;
        }
        setGuides(response.items);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error
            ? reason.message
            : 'No se pudieron cargar las guías. Inténtalo de nuevo.');
        }
      })
      .finally(() => {
        if (active && !correctedPage) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [categoryId, guideReload, page, query, selectedGuide]);

  useEffect(() => {
    if (!selectedGuide || !selectedGuide.fileUrl) return;
    let active = true;
    let objectUrl: string | null = null;
    const guideId = String(selectedGuide.id);
    getPublicGuidePdf(guideId)
      .then(file => {
        if (!active) return;
        objectUrl = URL.createObjectURL(file);
        setPdf({ id: guideId, url: objectUrl });
      })
      .catch((reason: unknown) => {
        if (active) {
          setPdfError({
            id: guideId,
            message: reason instanceof Error
              ? reason.message
              : 'No se pudo abrir el archivo PDF de la guía.',
          });
        }
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedGuide]);

  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(1);
    setIsLoading(true);
    setError(null);
  };

  const updateCategory = (value: string) => {
    setCategoryId(value);
    setPage(1);
    setIsLoading(true);
    setError(null);
  };

  const retryCategories = () => {
    setCategoriesLoading(true);
    setCategoryError(null);
    setCategoryReload(current => current + 1);
  };

  const retryGuides = () => {
    setIsLoading(true);
    setError(null);
    setGuideReload(current => current + 1);
  };

  const openGuide = (guide: Guide) => {
    setPdfError(null);
    navigate(location.pathname, { state: { selectedGuide: guide } });
  };

  const filteredGuides = guides;
  const activePdf = selectedGuide && pdf?.id === String(selectedGuide.id) ? pdf.url : null;
  const activePdfError =
    selectedGuide && pdfError?.id === String(selectedGuide.id) ? pdfError.message : null;

  if (selectedGuide) {
    const downloadName = selectedGuide.file ?? `${selectedGuide.title}.pdf`;
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
            {activePdf && (
              <>
                <a className="public-button" href={activePdf} download={downloadName}>Descargar PDF</a>
                <a className="guide-open-link" href={activePdf} target="_blank" rel="noopener noreferrer">
                  Abrir PDF en otra pestaña
                </a>
              </>
            )}
          </div>
        </header>
        <p className="guide-description">Material de aprendizaje de la categoría {selectedGuide.category}.</p>
        {activePdfError && <p className="public-error" role="alert">{activePdfError}</p>}
        {!activePdf && !activePdfError && selectedGuide.fileUrl && <p role="status">Cargando archivo PDF…</p>}
        {!selectedGuide.fileUrl && <p role="status">Esta guía no tiene un archivo PDF disponible.</p>}
        {activePdf && (
          <iframe
            className="guide-pdf-viewer"
            src={activePdf}
            title={`Guía en PDF: ${selectedGuide.title}`}
          />
        )}
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
            onChange={event => updateQuery(event.target.value)}
          />
          <label className="visually-hidden" htmlFor="guide-category">Filtrar guías por categoría</label>
          <select
            id="guide-category"
            value={categoryId}
            onChange={event => updateCategory(event.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </div>
      </header>

      {categoriesLoading && <p role="status">Cargando categorías…</p>}
      {categoryError && (
        <div className="public-error" role="alert">
          <p>{categoryError}</p>
          <button type="button" onClick={retryCategories}>Reintentar</button>
        </div>
      )}
      {error && (
        <div className="public-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={retryGuides}>Reintentar</button>
        </div>
      )}
      {isLoading && <p role="status">Cargando guías…</p>}
      {!isLoading && !error && filteredGuides.length > 0 ? (
        <>
          <p className="guides-result-count">
            Se encontraron {totalGuides} {totalGuides === 1 ? 'guía' : 'guías'}.
          </p>
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
          <Pagination
            page={page}
            totalPages={totalPages}
            setPage={nextPage => {
              setPage(nextPage);
              setIsLoading(true);
              setError(null);
            }}
            label="Páginas del catálogo de guías"
          />
        </>
      ) : !isLoading && !error ? (
        <p className="guides-empty" role="status">No se encontraron guías con esos filtros.</p>
      ) : null}
    </section>
  );
};
