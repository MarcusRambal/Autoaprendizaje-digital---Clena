import './EditGuidesPanel.css';
import { useEffect, useState, type FormEvent } from 'react';
import type { Category, Guide } from '../../../types/contracts';
import { matchesSearch } from './searchContent';
import { Pagination } from './Pagination';
import { usePagination } from './usePagination';
import { getManagedGuidePdf } from '../../../services/guidesApi';

type ViewState = 'guideView' | 'createView' | 'editView' | 'deleteView';

interface GuidePagination {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}

interface EditGuidesPanelProps {
  categories: Category[];
  guides: Guide[];
  searchQuery: string;
  totalGuides?: number;
  serverPagination?: GuidePagination;
  onCreate: (guide: Omit<Guide, 'id'>) => void | Promise<void>;
  onSave: (guide: Guide) => void | Promise<void>;
  onDelete: (guideId: Guide['id']) => void | Promise<void>;
}

interface EditGuideRowProps {
  guide: Guide;
  guides: Guide[];
  categories: Category[];
  hidden: boolean;
  onSave: (updatedGuide: Guide) => void | Promise<void>;
}

const getGuideFileName = (file: Guide['file']) =>
  file instanceof File ? file.name : file ?? 'Sin archivo adjunto';

const normalizeTitle = (title: string) => title.toLowerCase().replace(/\s+/g, '');
const isPdf = (file: File) =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

const EditGuideRow = ({ guide, guides, categories, hidden, onSave }: EditGuideRowProps) => {
  const [draftTitle, setDraftTitle] = useState(guide.title);
  const [draftCategoryId, setDraftCategoryId] = useState(
    guide.categoryId ?? categories.find(category => category.title === guide.category)?.id ?? '',
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmedTitle = draftTitle.trim();

    if (!trimmedTitle) {
      setError('El título de la guía no puede estar vacío.');
      return;
    }

    const category = categories.find(item => item.id === draftCategoryId);
    if (!category) {
      setError('Debes seleccionar una categoría válida.');
      return;
    }

    const isDuplicate = guides.some(
      item => item.id !== guide.id && normalizeTitle(item.title) === normalizeTitle(trimmedTitle)
    );

    if (isDuplicate) {
      setError(`La guía "${trimmedTitle}" ya existe.`);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onSave({
        ...guide,
        title: trimmedTitle,
        category: category.title,
        categoryId: category.id,
        file: selectedFile ?? guide.file,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar la guía.');
    } finally {
      setSaving(false);
    }
  };

  const isChanged =
    draftTitle.trim() !== guide.title ||
    draftCategoryId !== (guide.categoryId ?? categories.find(category => category.title === guide.category)?.id) ||
    selectedFile !== null;

  return (
    <li className="edit-category-item guide-edit-item" hidden={hidden}>
      <div className="guide-edit-fields">
        <label className="guide-edit-field">
          <span>Título de la guía</span>
          <input
            type="text"
            value={draftTitle}
            maxLength={120}
            aria-label={`Título de ${guide.title}`}
            onChange={event => {
              setDraftTitle(event.target.value);
              setError(null);
            }}
            className={error ? 'input-error' : ''}
            placeholder="Título de la guía"
          />
        </label>
        <label className="guide-edit-field">
          <span>Categoría</span>
          <select
            value={draftCategoryId}
            aria-label={`Categoría de ${guide.title}`}
            onChange={event => {
              setDraftCategoryId(event.target.value);
              setError(null);
            }}
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.title}</option>
            ))}
          </select>
        </label>
        <label className="guide-edit-field guide-edit-file">
          <span>Archivo PDF</span>
          <input
            type="file"
            accept=".pdf,application/pdf"
            aria-label={`Reemplazar archivo de ${guide.title}`}
            onChange={event => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (!isPdf(file)) {
                setError('Solo se admiten archivos en formato .pdf');
                setSelectedFile(null);
                event.target.value = '';
                return;
              }
              if (file.size > 10 * 1024 * 1024) {
                setError('El archivo PDF no puede superar los 10 MB.');
                setSelectedFile(null);
                event.target.value = '';
                return;
              }
              setSelectedFile(file);
              setError(null);
            }}
          />
          <span className="file-info">
            {selectedFile ? selectedFile.name : `Actual: ${getGuideFileName(guide.file)}`}
          </span>
        </label>
        {error && <span className="error-text" role="alert">{error}</span>}
      </div>
      <button type="button" onClick={handleSave} disabled={!isChanged || saving}>
        {saving ? 'Guardando…' : 'Guardar'}
      </button>
    </li>
  );
};

export const EditGuidesPanel = ({
  categories,
  guides,
  searchQuery,
  totalGuides,
  serverPagination,
  onCreate,
  onSave,
  onDelete
}: EditGuidesPanelProps) => {
  const [viewState, setViewState] = useState<ViewState>('guideView');
  const [selectedGuide, setSelectedGuide] = useState<{ guide: Guide; url: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingGuideId, setDeletingGuideId] = useState<Guide['id'] | null>(null);
  const filteredGuides = guides.filter(guide => matchesSearch(searchQuery, guide.title, guide.category));
  const localPagination = usePagination(filteredGuides, `${viewState}:${searchQuery}`);
  const pagination = serverPagination ?? localPagination;
  const pageGuides = serverPagination ? filteredGuides : localPagination.items;
  const visibleGuideIds = new Set(pageGuides.map(guide => guide.id));
  const displayedGuideCount = totalGuides ?? guides.length;
  const selectedGuideMatches = selectedGuide !== null &&
    filteredGuides.some(guide => guide.id === selectedGuide.guide.id);

  const handleCreateGuide = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = newTitle.trim();

    if (!trimmedTitle) {
      setCreateError('El título no puede estar vacío.');
      return;
    }

    const category = categories.find(item => item.id === newCategory);
    if (!category) {
      setCreateError('Selecciona una categoría válida para la guía.');
      return;
    }

    if (!newFile || !isPdf(newFile)) {
      setCreateError('Debes adjuntar un archivo en formato .pdf.');
      return;
    }
    if (newFile.size > 10 * 1024 * 1024) {
      setCreateError('El archivo PDF no puede superar los 10 MB.');
      return;
    }

    const isDuplicate = guides.some(
      guide => normalizeTitle(guide.title) === normalizeTitle(trimmedTitle)
    );

    if (isDuplicate) {
      setCreateError(`La guía "${trimmedTitle}" ya existe.`);
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      await onCreate({
        title: trimmedTitle,
        category: category.title,
        categoryId: category.id,
        file: newFile,
      });
      setNewTitle('');
      setNewCategory('');
      setNewFile(null);
      const fileInput = document.getElementById('new-guide-file');
      if (fileInput instanceof HTMLInputElement) fileInput.value = '';
    } catch (reason) {
      setCreateError(reason instanceof Error ? reason.message : 'No se pudo crear la guía.');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenGuide = async (guide: Guide) => {
    setPreviewError(null);
    if (guide.file instanceof File) {
      setSelectedGuide({ guide, url: URL.createObjectURL(guide.file) });
      return;
    }
    if (guide.fileUrl && typeof guide.id === 'string') {
      setPreviewLoading(true);
      try {
        const file = await getManagedGuidePdf(guide.id);
        setSelectedGuide({ guide, url: URL.createObjectURL(file) });
      } catch (reason) {
        setPreviewError(reason instanceof Error ? reason.message : 'No se pudo abrir el archivo PDF de la guía.');
      } finally {
        setPreviewLoading(false);
      }
      return;
    }
    if (typeof guide.file === 'string') {
      setSelectedGuide({ guide, url: `/${encodeURIComponent(guide.file)}` });
      return;
    }
    setPreviewError('Esta guía no tiene un archivo PDF disponible.');
  };

  useEffect(() => {
    if (!selectedGuide?.url.startsWith('blob:')) return;
    return () => URL.revokeObjectURL(selectedGuide.url);
  }, [selectedGuide]);

  const handleDeleteGuide = async (guide: Guide) => {
    if (!window.confirm(`¿Eliminar la guía "${guide.title}" y su archivo PDF? Esta acción no se puede deshacer.`)) {
      return;
    }
    setDeletingGuideId(guide.id);
    setDeleteError(null);
    try {
      await onDelete(guide.id);
      setSelectedGuide(current => current?.guide.id === guide.id ? null : current);
    } catch (reason) {
      setDeleteError(reason instanceof Error ? reason.message : 'No se pudo eliminar la guía.');
    } finally {
      setDeletingGuideId(null);
    }
  };

  return (
    <section className="edit-panel guide-management" aria-labelledby="guides-management-title">
      <h2 id="guides-management-title">Gestión de guías</h2>

      <div className="viewCreateEditGuides">
        <div className="viewButton" role="group" aria-label="Acciones de guías">
          <button
            type="button"
            className={`buttonGuide ${viewState === 'guideView' ? 'active' : ''}`}
            aria-pressed={viewState === 'guideView'}
            aria-controls="guide-management-panel"
            onClick={() => setViewState('guideView')}
          >
            Ver guías
          </button>
          <button
            type="button"
            className={`buttonGuide ${viewState === 'createView' ? 'active' : ''}`}
            aria-pressed={viewState === 'createView'}
            aria-controls="guide-management-panel"
            onClick={() => {
              setNewTitle('');
              setNewCategory('');
              setNewFile(null);
              setCreateError(null);
              setViewState('createView');
            }}
          >
            Crear guía
          </button>
          <button
            type="button"
            className={`buttonGuide ${viewState === 'editView' ? 'active' : ''}`}
            aria-pressed={viewState === 'editView'}
            aria-controls="guide-management-panel"
            onClick={() => setViewState('editView')}
          >
            Editar guías
          </button>
          <button
            type="button"
            className={`buttonGuide ${viewState === 'deleteView' ? 'active' : ''}`}
            aria-pressed={viewState === 'deleteView'}
            aria-controls="guide-management-panel"
            onClick={() => setViewState('deleteView')}
          >
            Eliminar guías
          </button>
        </div>

        <div id="guide-management-panel" className="guide-management-panel">
        {deleteError && <p className="error-text" role="alert">{deleteError}</p>}
        {viewState === 'guideView' && (
          <div className={`guide-view-layout ${selectedGuideMatches ? 'has-preview' : ''}`}>
            <div className="guide-list">
              <h3>Todas las guías</h3>
            {pageGuides.length > 0 ? (
              <ul className="category-view-list">
                {pageGuides.map(guide => (
                  <li key={guide.id}>
                    <button
                      className="guide-preview-button"
                      type="button"
                      aria-pressed={selectedGuide?.guide.id === guide.id}
                      onClick={() => handleOpenGuide(guide)}
                      disabled={guide.file === null}
                    >
                      <strong>{guide.title}</strong>
                      <span className="guide-preview-category">{guide.category}</span>
                      <small>{getGuideFileName(guide.file)} · Abrir vista previa</small>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p role="status">{searchQuery ? 'No se encontraron guías para esta búsqueda.' : 'No hay guías creadas.'}</p>}
            {previewLoading && <p role="status">Cargando archivo PDF…</p>}
            {previewError && <p className="error-text" role="alert">{previewError}</p>}
            <Pagination {...pagination} label="Páginas de guías" />
            </div>
            {selectedGuide && (
              <section className="guide-preview" hidden={!selectedGuideMatches} aria-label={`Vista previa de ${selectedGuide.guide.title}`}>
                <div className="guide-preview-header">
                  <h3>{selectedGuide.guide.title}</h3>
                  <button type="button" onClick={() => setSelectedGuide(null)}>Cerrar PDF</button>
                </div>
                <a href={selectedGuide.url} target="_blank" rel="noopener noreferrer">Abrir PDF en otra pestaña</a>
                <iframe
                  title={`PDF de ${selectedGuide.guide.title}`}
                  src={selectedGuide.url}
                  className="guide-preview-frame"
                />
              </section>
            )}
          </div>
        )}

        {viewState === 'createView' && (
          <div>
            <h3>Crear una guía</h3>
            <p role="status">Al crearla, la guía se publica en el catálogo público.</p>
            {categories.length > 0 ? (
              <form className="create-category-form guide-create-form" onSubmit={handleCreateGuide}>
                <div className="input-group">
                  <label htmlFor="new-guide-title">Título de la guía</label>
                  <input
                    id="new-guide-title"
                    type="text"
                    placeholder="Título de la guía"
                    maxLength={120}
                    required
                    value={newTitle}
                    onChange={event => {
                      setNewTitle(event.target.value);
                      setCreateError(null);
                    }}
                    className={createError && !newTitle.trim() ? 'input-error' : ''}
                  />
                  <label htmlFor="new-guide-category">Categoría</label>
                  <select
                    id="new-guide-category"
                    value={newCategory}
                    required
                    onChange={event => {
                      setNewCategory(event.target.value);
                      setCreateError(null);
                    }}
                    className={createError && !newCategory ? 'input-error' : ''}
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.title}</option>
                    ))}
                  </select>
                  <label htmlFor="new-guide-file">Archivo PDF</label>
                  <input
                    id="new-guide-file"
                    type="file"
                    accept=".pdf,application/pdf"
                    required
                    onChange={event => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (!isPdf(file)) {
                        setCreateError('Solo se admiten archivos en formato .pdf');
                        setNewFile(null);
                        event.target.value = '';
                        return;
                      }
                      setNewFile(file);
                      setCreateError(null);
                    }}
                    className={createError && !newFile ? 'input-error' : ''}
                  />
                  {newFile && <span className="file-info">{newFile.name}</span>}
                  {createError && <span className="error-text" role="alert">{createError}</span>}
                </div>
                <button type="submit" disabled={creating}>
                  {creating ? 'Creando…' : 'Crear guía'}
                </button>
              </form>
            ) : <p role="status">Crea una categoría antes de agregar guías.</p>}
          </div>
        )}

        {viewState === 'editView' && (
          <div>
            <h3>Editar guías</h3>
            {guides.length > 0 && categories.length > 0 ? (
              <ul className="edit-category-list">
                {guides.map(guide => (
                  <EditGuideRow
                    key={`${guide.id}-${guide.title}-${guide.category}-${getGuideFileName(guide.file)}`}
                    guide={guide}
                    guides={guides}
                    categories={categories}
                    hidden={!visibleGuideIds.has(guide.id)}
                    onSave={async updatedGuide => {
                      await onSave(updatedGuide);
                      setSelectedGuide(null);
                    }}
                  />
                ))}
              </ul>
            ) : <p role="status">{displayedGuideCount === 0 ? (searchQuery ? 'No se encontraron guías para esta búsqueda.' : 'No hay guías para editar.') : 'Crea una categoría para editar las guías.'}</p>}
            {guides.length > 0 && categories.length > 0 && filteredGuides.length === 0 && <p role="status">No se encontraron guías para esta búsqueda.</p>}
            <Pagination {...pagination} label="Páginas de guías para editar" />
          </div>
        )}

        {viewState === 'deleteView' && (
          <div>
            <h3>Eliminar guías</h3>
            {guides.length > 0 ? (
              <ul className="category-view-list">
                {pageGuides.map(guide => (
                  <li key={guide.id}>
                    <span className="guide-delete-details">
                      <strong>{guide.title}</strong>
                      <small>{guide.category}</small>
                    </span>
                    <button
                      type="button"
                      aria-label={`Eliminar guía ${guide.title}`}
                      onClick={() => handleDeleteGuide(guide)}
                      disabled={deletingGuideId !== null}
                    >
                      {deletingGuideId === guide.id ? 'Eliminando…' : 'Eliminar'}
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p role="status">{searchQuery ? 'No se encontraron guías para esta búsqueda.' : 'No hay guías para eliminar.'}</p>}
            {guides.length > 0 && filteredGuides.length === 0 && <p role="status">No se encontraron guías para esta búsqueda.</p>}
            <Pagination {...pagination} label="Páginas de guías para eliminar" />
          </div>
        )}
        </div>
      </div>
    </section>
  );
};
