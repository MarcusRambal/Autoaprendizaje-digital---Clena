import './ControlPanel.css';
import { useEffect, useState } from 'react';
import type { Category, Guide, Quiz } from '../../../types/contracts';
import { createCategory, deleteCategory, listCategories, renameCategory } from '../../../services/categoriesApi';
import {
  createManagedGuide,
  deleteManagedGuide,
  listManagedGuides,
  setManagedGuidePublication,
  updateManagedGuide,
} from '../../../services/guidesApi';
import { EditCategoriesPanel } from './EditCategoriesPanel';
import { EditGuidesPanel } from './EditGuidesPanel';
import { EditQuizPanel } from './EditQuizPanel';
import { togglePublished } from './publication';
import { matchesSearch } from './searchContent';
import { Pagination } from './Pagination';
import { usePagination } from './usePagination';

const initialCategories: Category[] = [
  { id: '1', title: 'Categoria 1' },
  { id: '2', title: 'Categoria 2' },
  { id: '3', title: 'Categoria 3' },
  { id: '4', title: 'Categoria 4' },
  { id: '5', title: 'Categoria 5' },
  { id: '6', title: 'Categoria 6' },
  { id: '7', title: 'Categoria 7' },
  { id: '8', title: 'Categoria 8' },
  { id: '9', title: 'Categoria 9' },
  { id: '10', title: 'Categoria 10' }
];

const initialGuides: Guide[] = [
  { id: 1, title: 'Guia 1', file: 'guia1.pdf', category: 'Categoria 1' },
  { id: 2, title: 'Guia 2', file: 'guia2.pdf', category: 'Categoria 2' },
  { id: 3, title: 'Guia 3', file: 'guia3.pdf', category: 'Categoria 3' },
  { id: 4, title: 'Guia 4', file: 'guia4.pdf', category: 'Categoria 1' },
  { id: 5, title: 'Guia 5', file: 'guia5.pdf', category: 'Categoria 2' },
  { id: 6, title: 'Guia 6', file: 'guia6.pdf', category: 'Categoria 3' },
  { id: 7, title: 'Guia 7', file: 'guia7.pdf', category: 'Categoria 1' },
  { id: 8, title: 'Guia 8', file: 'guia8.pdf', category: 'Categoria 2' },
  { id: 9, title: 'Guia 9', file: 'guia9.pdf', category: 'Categoria 3' },
  { id: 10, title: 'Guia 10', file: 'guia10.pdf', category: 'Categoria 1' },
];



const nextId = <T extends { id: number | string }>(items: T[]) =>
  items.reduce(
    (largestId, item) => {
      const id = typeof item.id === 'number' ? item.id : Number(item.id);
      return Number.isSafeInteger(id) ? Math.max(largestId, id) : largestId;
    },
    0,
  ) + 1;

interface ControlPanelData {
  categories: Category[];
  guides: Guide[];
  quizzes: Quiz[];
}

interface ControlPanelProps {
  initialData?: ControlPanelData;
  mode?: 'all' | 'categories' | 'content';
}

export const ControlPanel = ({ initialData, mode = 'all' }: ControlPanelProps) => {
  const usesBackendCategories =
    (mode === 'categories' || mode === 'content') && initialData === undefined;
  const usesBackendGuides = mode === 'content' && initialData === undefined;
  const [activeSection, setActiveSection] = useState<'categories' | 'guides' | 'quizzes'>(mode === 'categories' ? 'categories' : 'guides');
  const [categories, setCategories] = useState<Category[]>(initialData?.categories ?? (usesBackendCategories ? [] : initialCategories));
  const [guides, setGuides] = useState<Guide[]>(initialData?.guides ?? (usesBackendGuides ? [] : initialGuides));
  const [quizzes, setQuizzes] = useState<Quiz[]>(initialData?.quizzes ?? []);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriesLoading, setCategoriesLoading] = useState(usesBackendCategories);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [guidesLoading, setGuidesLoading] = useState(usesBackendGuides);
  const [guidesError, setGuidesError] = useState<string | null>(null);
  const [guidesTotal, setGuidesTotal] = useState(0);
  const [guidePage, setGuidePage] = useState(1);
  const [guideTotalPages, setGuideTotalPages] = useState(1);
  const [guideReload, setGuideReload] = useState(0);
  const [publicationError, setPublicationError] = useState<string | null>(null);
  const [publishingGuideId, setPublishingGuideId] = useState<Guide['id'] | null>(null);
  const [publishedGuides, setPublishedGuides] = useState<Guide['id'][]>([]);
  const [publishedQuizzes, setPublishedQuizzes] = useState<number[]>([]);
  const filteredGuides = guides.filter(guide => matchesSearch(searchQuery, guide.title, guide.category));
  const filteredQuizzes = quizzes.filter(quiz => matchesSearch(searchQuery, quiz.name, quiz.category));
  const guidePublicationPages = usePagination(filteredGuides, searchQuery);
  const quizPublicationPages = usePagination(filteredQuizzes, searchQuery);
  const guidePagination = {
    page: guidePage,
    totalPages: guideTotalPages,
    setPage: (page: number) => {
      setGuidesLoading(true);
      setGuidesError(null);
      setGuidePage(page);
    },
  };
  const guidePublicationItems = usesBackendGuides
    ? filteredGuides
    : guidePublicationPages.items;

  const loadCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      setCategories(await listCategories());
    } catch (reason) {
      setCategoriesError(reason instanceof Error ? reason.message : 'No se pudieron cargar las categorías.');
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    if (!usesBackendCategories) return;
    let active = true;
    listCategories()
      .then(items => {
        if (active) setCategories(items);
      })
      .catch((reason: unknown) => {
        if (active) setCategoriesError(reason instanceof Error ? reason.message : 'No se pudieron cargar las categorías.');
      })
      .finally(() => {
        if (active) setCategoriesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [usesBackendCategories]);

  useEffect(() => {
    if (!usesBackendGuides) return;
    let active = true;
    let correctedPage = false;
    listManagedGuides({ page: guidePage, search: searchQuery })
      .then(response => {
        if (!active) return;
        setGuidesTotal(response.total);
        const safeTotalPages = Math.max(1, response.totalPages);
        setGuideTotalPages(safeTotalPages);
        if (guidePage > safeTotalPages) {
          correctedPage = true;
          setGuidePage(safeTotalPages);
          return;
        }
        setGuides(response.items);
      })
      .catch((reason: unknown) => {
        if (active) {
          setGuidesError(reason instanceof Error
            ? reason.message
            : 'No se pudieron cargar las guías. Inténtalo de nuevo.');
        }
      })
      .finally(() => {
        if (active && !correctedPage) setGuidesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [guidePage, guideReload, searchQuery, usesBackendGuides]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (usesBackendGuides) {
      setGuidePage(1);
      setGuidesLoading(true);
      setGuidesError(null);
    }
  };

  const reloadManagedGuides = () => {
    setGuidesLoading(true);
    setGuidesError(null);
    setGuideReload(current => current + 1);
  };

  const handleCreateCategory = async (title: string) => {
    if (usesBackendCategories) {
      const created = await createCategory(title);
      setCategories(current => [...current, created]);
      return;
    }
    setCategories(current => [...current, { id: String(nextId(current)), title }]);
  };

  const handleSaveCategory = async (updatedCategory: Category) => {
    const previousCategory = categories.find(category => category.id === updatedCategory.id);
    if (usesBackendCategories) {
      const saved = await renameCategory(String(updatedCategory.id), updatedCategory.title);
      setCategories(current =>
        current.map(category => category.id === saved.id ? saved : category)
      );
      return;
    }
    setCategories(current =>
      current.map(category => category.id === updatedCategory.id ? updatedCategory : category)
    );
    setGuides(current =>
      current.map(guide => guide.category === previousCategory?.title
        ? { ...guide, category: updatedCategory.title }
        : guide)
    );
    setQuizzes(current =>
      current.map(quiz => quiz.category === previousCategory?.title
        ? { ...quiz, category: updatedCategory.title }
        : quiz)
    );
  };

  const handleDeleteCategory = async (categoryId: Category['id']) => {
    const category = categories.find(item => item.id === categoryId);
    if (!category) return null;

    if (usesBackendCategories) {
      await deleteCategory(String(categoryId));
      setCategories(current => current.filter(item => item.id !== categoryId));
      return null;
    }

    const isInUse =
      guides.some(guide => guide.category === category.title) ||
      quizzes.some(quiz => quiz.category === category.title);

    if (isInUse) {
      return 'No se puede eliminar esta categoría porque tiene guías o lecciones asociadas.';
    }

    setCategories(current => current.filter(item => item.id !== categoryId));
    return null;
  };

  const canManageGuides = !usesBackendGuides || (!categoriesLoading && !categoriesError);

  const handleCreateGuide = async (guide: Omit<Guide, 'id'>) => {
    if (usesBackendGuides) {
      const categoryId =
        guide.categoryId ??
        categories.find(category => category.title === guide.category)?.id;
      if (!categoryId || !(guide.file instanceof File)) {
        throw new Error('Selecciona una categoría y adjunta un archivo PDF válido.');
      }
      await createManagedGuide({
        title: guide.title,
        categoryId,
        file: guide.file,
      });
      setGuidePage(1);
      reloadManagedGuides();
      return;
    }
    setGuides(current => [...current, { ...guide, id: nextId(current) }]);
  };

  const handleSaveGuide = async (updatedGuide: Guide) => {
    if (usesBackendGuides) {
      const categoryId =
        updatedGuide.categoryId ??
        categories.find(category => category.title === updatedGuide.category)?.id;
      if (typeof updatedGuide.id !== 'string' || !categoryId) {
        throw new Error('Selecciona una categoría válida para la guía.');
      }
      const saved = await updateManagedGuide({
        id: updatedGuide.id,
        title: updatedGuide.title,
        categoryId,
        ...(updatedGuide.file instanceof File ? { file: updatedGuide.file } : {}),
      });
      setGuides(current =>
        current.map(guide => guide.id === saved.id ? saved : guide)
      );
      return;
    }
    setGuides(current =>
      current.map(guide => guide.id === updatedGuide.id ? updatedGuide : guide)
    );
  };

  const handleDeleteGuide = async (guideId: Guide['id']) => {
    if (usesBackendGuides) {
      if (typeof guideId !== 'string') {
        throw new Error('No se pudo identificar la guía que quieres eliminar.');
      }
      await deleteManagedGuide(guideId);
      setGuides(current => current.filter(guide => guide.id !== guideId));
      setGuidesTotal(current => Math.max(0, current - 1));
      reloadManagedGuides();
      return;
    }
    setGuides(current => current.filter(guide => guide.id !== guideId));
    setPublishedGuides(current => current.filter(id => id !== guideId));
  };

  const handleGuidePublication = async (guide: Guide) => {
    if (!usesBackendGuides || typeof guide.id !== 'string') {
      setPublishedGuides(current => togglePublished(current, guide.id));
      return;
    }
    setPublicationError(null);
    setPublishingGuideId(guide.id);
    try {
      const updated = await setManagedGuidePublication(
        guide.id,
        guide.publicationState !== 'PUBLISHED',
      );
      setGuides(current =>
        current.map(item => item.id === updated.id ? updated : item)
      );
    } catch (reason) {
      setPublicationError(reason instanceof Error
        ? reason.message
        : 'No se pudo actualizar la publicación de la guía.');
    } finally {
      setPublishingGuideId(null);
    }
  };

  const handleCreateQuiz = (quiz: Omit<Quiz, 'id'>) => {
    setQuizzes(current => [...current, { ...quiz, id: nextId(current) }]);
  };

  const handleSaveQuiz = (updatedQuiz: Quiz) => {
    setQuizzes(current =>
      current.map(quiz => quiz.id === updatedQuiz.id ? updatedQuiz : quiz)
    );
  };

  const handleDeleteQuiz = (quizId: number) => {
    setQuizzes(current => current.filter(quiz => quiz.id !== quizId));
    setPublishedQuizzes(current => current.filter(id => id !== quizId));
  };

  return (
    <div className="control-panel">
      <header className="control-panel-header">
        <h1>{mode === 'categories' ? 'Categorías' : mode === 'content' ? 'Guías y lecciones' : 'Panel de control'}</h1>
        <p>{mode === 'categories' ? 'Organiza las categorías de la plataforma.' : mode === 'content' ? 'Organiza las guías y lecciones de la plataforma.' : 'Organiza las categorías, guías y lecciones de la plataforma.'}</p>
        {usesBackendGuides
          ? <p role="status">Las guías se consultan y administran desde el servidor.</p>
          : usesBackendCategories
            ? <p role="status">Las categorías se cargan y guardan en el servidor.</p>
          : <p role="status"><strong>Demostración:</strong> los datos son de prueba y los cambios no se guardan en el servidor.</p>}
      </header>
      <div className="control-panel-toolbar">
        <div className="section-tabs" role="group" aria-label="Sección del panel de control">
          {mode !== 'content' && <button
            type="button"
            className={`tab-btn ${activeSection === 'categories' ? 'active' : ''}`}
            aria-pressed={activeSection === 'categories'}
            onClick={() => setActiveSection('categories')}
          >
            Categorías
          </button>}
          {mode !== 'categories' && <button
            type="button"
            className={`tab-btn ${activeSection === 'guides' ? 'active' : ''}`}
            aria-pressed={activeSection === 'guides'}
            onClick={() => setActiveSection('guides')}
          >
            Guías
          </button>}
          {mode !== 'categories' && <button
            type="button"
            className={`tab-btn ${activeSection === 'quizzes' ? 'active' : ''}`}
            aria-pressed={activeSection === 'quizzes'}
            onClick={() => setActiveSection('quizzes')}
          >
            Lecciones
          </button>}
        </div>
        <div className="control-panel-search">
          <label htmlFor="control-panel-search">Buscar contenido</label>
          <div className="control-panel-search-controls">
            <input
              id="control-panel-search"
              type="search"
              placeholder={usesBackendGuides ? 'Buscar guía por título' : 'Buscar por nombre o categoría'}
              value={searchQuery}
              onChange={event => handleSearchChange(event.target.value)}
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')}>Limpiar búsqueda</button>
            )}
          </div>
        </div>
      </div>

      <div className="section-content">
        {mode !== 'content' && <div hidden={activeSection !== 'categories'}>
          {categoriesLoading
            ? <p role="status">Cargando categorías…</p>
            : categoriesError
              ? <div role="alert">
                  <p>{categoriesError}</p>
                  <button type="button" onClick={loadCategories}>Reintentar</button>
                </div>
              : <EditCategoriesPanel
                  categories={categories}
                  searchQuery={searchQuery}
                  onCreate={handleCreateCategory}
                  onSave={handleSaveCategory}
                  onDelete={handleDeleteCategory}
                />}
        </div>}
        {mode !== 'categories' && <div hidden={activeSection !== 'guides'}>
          {usesBackendGuides && categoriesLoading && <p role="status">Cargando categorías…</p>}
          {usesBackendGuides && categoriesError && (
            <div role="alert">
              <p>{categoriesError}</p>
              <button type="button" onClick={loadCategories}>Reintentar</button>
            </div>
          )}
          {usesBackendGuides && guidesLoading && <p role="status">Cargando guías…</p>}
          {usesBackendGuides && guidesError && (
            <div role="alert">
              <p>{guidesError}</p>
              <button type="button" onClick={reloadManagedGuides}>Reintentar</button>
            </div>
          )}
          {canManageGuides && (
            <EditGuidesPanel
              categories={categories}
              guides={guides}
              searchQuery={searchQuery}
              totalGuides={usesBackendGuides ? guidesTotal : undefined}
              serverPagination={usesBackendGuides ? guidePagination : undefined}
              onCreate={handleCreateGuide}
              onSave={handleSaveGuide}
              onDelete={handleDeleteGuide}
            />
          )}
          {mode === 'content' && (
            <section className="guide-publication-panel" aria-labelledby="guide-publication-title">
              <h2 id="guide-publication-title">Estado de publicación de guías</h2>
              <p>{usesBackendGuides ? 'El estado de publicación se guarda en el servidor.' : 'Estos cambios son locales y no publican contenido en el catálogo.'}</p>
              {publicationError && <p role="alert">{publicationError}</p>}
              {guidePublicationItems.length > 0 ? (
                <ul className="guide-publication-list">
                {guidePublicationItems.map(guide => {
                  const isPublished = usesBackendGuides
                    ? guide.publicationState === 'PUBLISHED'
                    : publishedGuides.includes(guide.id);
                  const publicationLabel = usesBackendGuides
                    ? guide.publicationState === 'ARCHIVED' ? 'Archivada' : isPublished ? 'Publicada' : 'Borrador'
                    : isPublished ? 'Publicada · demostración' : 'Borrador · demostración';
                  return (
                  <li key={guide.id}>
                    <span className="guide-publication-info">
                      <strong>{guide.title}</strong>
                      <span className={`guide-publication-status ${isPublished ? 'is-published' : 'is-draft'}`}>
                        {publicationLabel}
                      </span>
                    </span>
                    <button
                      type="button"
                      aria-pressed={isPublished}
                      aria-label={`${isPublished ? 'Despublicar' : 'Publicar'} ${guide.title}`}
                      disabled={publishingGuideId === guide.id}
                      onClick={() => handleGuidePublication(guide)}
                    >
                      {publishingGuideId === guide.id
                        ? 'Guardando…'
                        : isPublished ? 'Despublicar' : 'Publicar'}
                    </button>
                  </li>
                  );
                })}
                </ul>
              ) : <p role="status">{searchQuery ? 'No hay guías que coincidan con esta búsqueda.' : 'No hay guías para publicar.'}</p>}
              <Pagination
                {...(usesBackendGuides ? guidePagination : guidePublicationPages)}
                label="Páginas de publicación de guías"
              />
            </section>
          )}
        </div>}
        {mode !== 'categories' && <div hidden={activeSection !== 'quizzes'}>
          <EditQuizPanel
            categories={categories}
            quizzes={quizzes}
            searchQuery={searchQuery}
            onCreate={handleCreateQuiz}
            onSave={handleSaveQuiz}
            onDelete={handleDeleteQuiz}
          />
          {mode === 'content' && (
            <section className="guide-publication-panel" aria-labelledby="quiz-publication-title">
              <h2 id="quiz-publication-title">Estado de publicación de lecciones</h2>
              <p>Estos cambios son locales y no publican contenido en el catálogo.</p>
              {quizzes.length === 0 && <p>Crea una lección de ejemplo para probar esta función.</p>}
              {quizzes.length > 0 && filteredQuizzes.length === 0 && <p role="status">No hay lecciones que coincidan con esta búsqueda.</p>}
              <ul className="guide-publication-list">
                {quizPublicationPages.items.map(quiz => (
                  <li key={quiz.id}>
                    <span>{quiz.name} — {publishedQuizzes.includes(quiz.id) ? 'Publicada (ejemplo)' : 'Borrador'}</span>
                    <button type="button" aria-pressed={publishedQuizzes.includes(quiz.id)} onClick={() => setPublishedQuizzes(current => togglePublished(current, quiz.id))}>
                      {publishedQuizzes.includes(quiz.id) ? 'Despublicar' : 'Publicar'} {quiz.name}
                    </button>
                  </li>
                ))}
              </ul>
              <Pagination {...quizPublicationPages} label="Páginas de publicación de lecciones" />
            </section>
          )}
        </div>}
      </div>
    </div>
  );
};
