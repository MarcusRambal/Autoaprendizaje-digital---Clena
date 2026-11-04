import './EditGuidesPanel.css';
import { useEffect, useState, type FormEvent } from 'react';
import type { Category, Guide } from '../../../types/quizGuides';

type ViewState = 'guideView' | 'createView' | 'editView' | 'deleteView';

interface EditGuidesPanelProps {
  categories: Category[];
  guides: Guide[];
  onCreate: (guide: Omit<Guide, 'id'>) => void;
  onSave: (guide: Guide) => void;
  onDelete: (guideId: number) => void;
}

interface EditGuideRowProps {
  guide: Guide;
  guides: Guide[];
  categories: Category[];
  onSave: (updatedGuide: Guide) => void;
}

const getGuideFileName = (file: Guide['file']) =>
  typeof file === 'string' ? file : file.name;

const normalizeTitle = (title: string) => title.toLowerCase().replace(/\s+/g, '');
const isPdf = (file: File) =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

const EditGuideRow = ({ guide, guides, categories, onSave }: EditGuideRowProps) => {
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
    <li className="edit-category-item">
      <div className="input-group">
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
        <div className="file-input-wrapper">
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
        </div>
        {error && <span className="error-text">{error}</span>}
      </div>
      <button type="button" onClick={handleSave} disabled={!isChanged}>Guardar</button>
    </li>
  );
};

export const EditGuidesPanel = ({
  categories,
  guides,
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
    <div className="edit-panel">
      <h1>Edición de Guías</h1>

      <div className="viewCreateEditGuides">
        <div className="viewButton">
          <button
            type="button"
            className={`buttonGuide ${viewState === 'guideView' ? 'active' : ''}`}
            onClick={() => setViewState('guideView')}
          >
            Ver Guías
          </button>
          <button
            type="button"
            className={`buttonGuide ${viewState === 'createView' ? 'active' : ''}`}
            onClick={() => {
              setNewTitle('');
              setNewCategory('');
              setNewFile(null);
              setCreateError(null);
              setViewState('createView');
            }}
          >
            Crear Guía
          </button>
          <button
            type="button"
            className={`buttonGuide ${viewState === 'editView' ? 'active' : ''}`}
            onClick={() => setViewState('editView')}
          >
            Editar Guía
          </button>
          <button
            type="button"
            className={`buttonGuide ${viewState === 'deleteView' ? 'active' : ''}`}
            onClick={() => setViewState('deleteView')}
          >
            Eliminar Guía
          </button>
        </div>

        {viewState === 'guideView' && (
          <div>
            <h3>Listado de Guías</h3>
            {guides.length > 0 ? (
              <ul className="category-view-list">
                {guides.map(guide => (
                  <li key={guide.id}>
                    <button
                      className="guide-preview-button"
                      type="button"
                      onClick={() => handleOpenGuide(guide)}
                    >
                      <strong>{guide.title}</strong> — {guide.category}
                      <small>📄 {getGuideFileName(guide.file)} · Ver PDF</small>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p>No hay guías creadas.</p>}
            {selectedGuide && (
              <section className="guide-preview" aria-label={`Vista previa de ${selectedGuide.guide.title}`}>
                <div className="guide-preview-header">
                  <h3>{selectedGuide.guide.title}</h3>
                  <button type="button" onClick={() => setSelectedGuide(null)}>Cerrar PDF</button>
                </div>
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
            <h3>Crear Nueva Guía</h3>
            {categories.length > 0 ? (
              <form className="create-category-form" onSubmit={handleCreateGuide}>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Título de la guía"
                    value={newTitle}
                    onChange={event => {
                      setNewTitle(event.target.value);
                      setCreateError(null);
                    }}
                    className={createError && !newTitle.trim() ? 'input-error' : ''}
                  />
                  <select
                    value={newCategory}
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
                  <input
                    id="new-guide-file"
                    type="file"
                    accept=".pdf,application/pdf"
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
                  {newFile && <span>{newFile.name}</span>}
                  {createError && <span className="error-text" role="alert">{createError}</span>}
                </div>
                <button type="submit">Crear Guía</button>
              </form>
            ) : <p>Crea una categoría antes de agregar guías.</p>}
          </div>
        )}

        {viewState === 'editView' && (
          <div>
            <h3>Editar Guías</h3>
            {guides.length > 0 && categories.length > 0 ? (
              <ul className="edit-category-list">
                {guides.map(guide => (
                  <EditGuideRow
                    key={`${guide.id}-${guide.title}-${guide.category}-${getGuideFileName(guide.file)}`}
                    guide={guide}
                    guides={guides}
                    categories={categories}
                    onSave={onSave}
                  />
                ))}
              </ul>
            ) : <p>{guides.length === 0 ? 'No hay guías para editar.' : 'Crea una categoría para editar las guías.'}</p>}
          </div>
        )}

        {viewState === 'deleteView' && (
          <div>
            <h3>Eliminar Guías</h3>
            {guides.length > 0 ? (
              <ul className="category-view-list">
                {guides.map(guide => (
                  <li key={guide.id}>
                    <span>{guide.title} ({guide.category})</span>
                    <button type="button" onClick={() => handleDeleteGuide(guide.id)}>Eliminar</button>
                  </li>
                ))}
              </ul>
            ) : <p>No hay guías para eliminar.</p>}
          </div>
        )}
      </div>
    </div>
  );
};
