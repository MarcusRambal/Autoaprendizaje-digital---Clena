import './EditGuidesPanel.css';
import { useEffect, useState, type FormEvent } from 'react';
import type { Category, Guide } from '../../../types/contracts';
import { matchesSearch } from './searchContent';
import { Pagination } from './Pagination';
import { usePagination } from './usePagination';

type ViewState = 'guideView' | 'createView' | 'editView' | 'deleteView';

interface EditGuidesPanelProps {
  categories: Category[];
  guides: Guide[];
  searchQuery: string;
  onCreate: (guide: Omit<Guide, 'id'>) => void;
  onSave: (guide: Guide) => void;
  onDelete: (guideId: number) => void;
}

interface EditGuideRowProps {
  guide: Guide;
  guides: Guide[];
  categories: Category[];
  hidden: boolean;
  onSave: (updatedGuide: Guide) => void;
}

const getGuideFileName = (file: Guide['file']) =>
  typeof file === 'string' ? file : file.name;

const normalizeTitle = (title: string) => title.toLowerCase().replace(/\s+/g, '');
const isPdf = (file: File) =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

const EditGuideRow = ({ guide, guides, categories, hidden, onSave }: EditGuideRowProps) => {
  const [draftTitle, setDraftTitle] = useState(guide.title);
  const [draftCategory, setDraftCategory] = useState(guide.category);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const trimmedTitle = draftTitle.trim();

    if (!trimmedTitle) {
      setError('El título de la guía no puede estar vacío.');
      return;
    }

    if (!categories.some(category => category.title === draftCategory)) {
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
    onSave({
      ...guide,
      title: trimmedTitle,
      category: draftCategory,
      file: selectedFile ?? guide.file
    });
  };

  const isChanged =
    draftTitle.trim() !== guide.title ||
    draftCategory !== guide.category ||
    selectedFile !== null;

  return (
    <li className="edit-category-item guide-edit-item" hidden={hidden}>
      <div className="guide-edit-fields">
        <label className="guide-edit-field">
          <span>Título de la guía</span>
          <input
            type="text"
            value={draftTitle}
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
            value={draftCategory}
            aria-label={`Categoría de ${guide.title}`}
            onChange={event => {
              setDraftCategory(event.target.value);
              setError(null);
            }}
          >
            {categories.map(category => (
              <option key={category.id} value={category.title}>{category.title}</option>
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
      <button type="button" onClick={handleSave} disabled={!isChanged}>Guardar</button>
    </li>
  );
};

export const EditGuidesPanel = ({
  categories,
  guides,
  searchQuery,
  onCreate,
  onSave,
  onDelete
}: EditGuidesPanelProps) => {
  const [viewState, setViewState] = useState<ViewState>('guideView');
  const [selectedGuide, setSelectedGuide] = useState<{ guide: Guide; url: string } | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const filteredGuides = guides.filter(guide => matchesSearch(searchQuery, guide.title, guide.category));
  const pagination = usePagination(filteredGuides, `${viewState}:${searchQuery}`);
  const visibleGuideIds = new Set(pagination.items.map(guide => guide.id));
  const selectedGuideMatches = selectedGuide !== null &&
    filteredGuides.some(guide => guide.id === selectedGuide.guide.id);

  const handleCreateGuide = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = newTitle.trim();

    if (!trimmedTitle) {
      setCreateError('El título no puede estar vacío.');
      return;
    }

    if (!categories.some(category => category.title === newCategory)) {
      setCreateError('Selecciona una categoría válida para la guía.');
      return;
    }

    if (!newFile || !isPdf(newFile)) {
      setCreateError('Debes adjuntar un archivo en formato .pdf.');
      return;
    }

    const isDuplicate = guides.some(
      guide => normalizeTitle(guide.title) === normalizeTitle(trimmedTitle)
    );

    if (isDuplicate) {
      setCreateError(`La guía "${trimmedTitle}" ya existe.`);
      return;
    }

    onCreate({ title: trimmedTitle, category: newCategory, file: newFile });
    setNewTitle('');
    setNewCategory('');
    setNewFile(null);
    setCreateError(null);
    const fileInput = document.getElementById('new-guide-file');
    if (fileInput instanceof HTMLInputElement) fileInput.value = '';
  };

  const handleOpenGuide = (guide: Guide) => {
    const url = guide.file instanceof File
      ? URL.createObjectURL(guide.file)
      : `/${encodeURIComponent(guide.file)}`;
    setSelectedGuide({ guide, url });
  };

  useEffect(() => {
    if (!selectedGuide?.url.startsWith('blob:')) return;
    return () => URL.revokeObjectURL(selectedGuide.url);
  }, [selectedGuide]);

  const handleDeleteGuide = (guideId: number) => {
    onDelete(guideId);
    setSelectedGuide(current => current?.guide.id === guideId ? null : current);
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
        {viewState === 'guideView' && (
          <div className={`guide-view-layout ${selectedGuideMatches ? 'has-preview' : ''}`}>
            <div className="guide-list">
              <h3>Todas las guías</h3>
            {guides.length > 0 ? (
              <ul className="category-view-list">
                {pagination.items.map(guide => (
                  <li key={guide.id}>
                    <button
                      className="guide-preview-button"
                      type="button"
                      aria-pressed={selectedGuide?.guide.id === guide.id}
                      onClick={() => handleOpenGuide(guide)}
                    >
                      <strong>{guide.title}</strong>
                      <span className="guide-preview-category">{guide.category}</span>
                      <small>{getGuideFileName(guide.file)} · Abrir vista previa</small>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p role="status">No hay guías creadas.</p>}
            {guides.length > 0 && filteredGuides.length === 0 && <p role="status">No se encontraron guías para esta búsqueda.</p>}
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
            {categories.length > 0 ? (
              <form className="create-category-form guide-create-form" onSubmit={handleCreateGuide}>
                <div className="input-group">
                  <label htmlFor="new-guide-title">Título de la guía</label>
                  <input
                    id="new-guide-title"
                    type="text"
                    placeholder="Título de la guía"
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
                      <option key={category.id} value={category.title}>{category.title}</option>
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
                <button type="submit">Crear guía</button>
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
                    onSave={updatedGuide => {
                      setSelectedGuide(null);
                      onSave(updatedGuide);
                    }}
                  />
                ))}
              </ul>
            ) : <p>{guides.length === 0 ? 'No hay guías para editar.' : 'Crea una categoría para editar las guías.'}</p>}
            {guides.length > 0 && categories.length > 0 && filteredGuides.length === 0 && <p role="status">No se encontraron guías para esta búsqueda.</p>}
            <Pagination {...pagination} label="Páginas de guías para editar" />
          </div>
        )}

        {viewState === 'deleteView' && (
          <div>
            <h3>Eliminar guías</h3>
            {guides.length > 0 ? (
              <ul className="category-view-list">
                {pagination.items.map(guide => (
                  <li key={guide.id}>
                    <span className="guide-delete-details">
                      <strong>{guide.title}</strong>
                      <small>{guide.category}</small>
                    </span>
                    <button type="button" aria-label={`Eliminar guía ${guide.title}`} onClick={() => handleDeleteGuide(guide.id)}>Eliminar</button>
                  </li>
                ))}
              </ul>
            ) : <p role="status">No hay guías para eliminar.</p>}
            {guides.length > 0 && filteredGuides.length === 0 && <p role="status">No se encontraron guías para esta búsqueda.</p>}
            <Pagination {...pagination} label="Páginas de guías para eliminar" />
          </div>
        )}
        </div>
      </div>
    </section>
  );
};
