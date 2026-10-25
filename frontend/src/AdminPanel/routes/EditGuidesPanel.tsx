// AdminPanel/routes/EditGuidesPanel.tsx
import './EditGuidesPanel.css';
import { useEffect, useState } from 'react';
import type { Guide } from '../../../types/contracts';

const mockCategories = [
  { id: 1, title: 'Categoria 1' },
  { id: 2, title: 'Categoria 2' },
  { id: 3, title: 'Categoria 3' }
];

const mockGuides: Guide[] = [
  { id: 1, title: 'Guia 1', file: 'guia1.pdf', category: 'Categoria 1' },
  { id: 2, title: 'Guia 2', file: 'guia2.pdf', category: 'Categoria 2' },
  { id: 3, title: 'Guia 3', file: 'guia3.pdf', category: 'Categoria 3' }
];

// --- Subcomponente para Edición Fila por Fila ---
interface EditGuideRowProps {
  guide: Guide;
  guides: Guide[];
  categories: Array<{ id: number; title: string }>;
  onSave: (updatedGuide: Guide) => void;
}

const EditGuideRow = ({ guide, guides, categories, onSave }: EditGuideRowProps) => {
  const [draftTitle, setDraftTitle] = useState(guide.title);
  const [draftCategory, setDraftCategory] = useState(guide.category);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraftTitle(guide.title);
    setDraftCategory(guide.category);
    setSelectedFile(null);
  }, [guide]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Solo se admiten archivos en formato .pdf');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      if (error) setError(null);
    }
  };

  const handleSave = () => {
    const trimmedTitle = draftTitle.trim();

    if (!trimmedTitle) {
      setError('El título de la guía no puede estar vacío.');
      return;
    }

    if (!draftCategory) {
      setError('Debes seleccionar una categoría.');
      return;
    }

    // Validación de duplicados ignorando espacios internos y mayúsculas
    const normalizedInput = trimmedTitle.toLowerCase().replace(/\s+/g, '');
    const isDuplicate = guides.some(
      g => g.id !== guide.id && g.title.toLowerCase().replace(/\s+/g, '') === normalizedInput
    );

    if (isDuplicate) {
      setError(`La guía "${trimmedTitle}" ya existe o es equivalente a una existente.`);
      return;
    }

    setError(null);
    onSave({
      ...guide,
      title: trimmedTitle,
      category: draftCategory,
      // Si se subió un nuevo archivo se asigna, de lo contrario se conserva el anterior
      file: selectedFile ? selectedFile.name : guide.file
    });
  };

  const isChanged =
    draftTitle.trim() !== guide.title ||
    draftCategory !== guide.category ||
    selectedFile !== null;

  return (
    <li className="edit-guide-item">
      <div className="input-group">
        <input type="text" value={draftTitle} onChange={e => { setDraftTitle(e.target.value);
            if (error) setError(null);
          }}
          className={error ? 'input-error' : ''}
          placeholder="Título de la guía"
        />

        <select value={draftCategory} onChange={e => { setDraftCategory(e.target.value);
            if (error) setError(null);
          }}
        >
          {categories.map(cat => (
            <option key={cat.id} value={cat.title}>
              {cat.title}
            </option>
          ))}
        </select>

        <div className="file-input-wrapper">
          <input type="file" accept=".pdf" onChange={handleFileChange} />
          <span className="file-info">
            {selectedFile ? selectedFile.name : `Actual: ${guide.file}`}
          </span>
        </div>

        {error && <span className="error-text">{error}</span>}
      </div>

      <button type="button" onClick={handleSave} disabled={!isChanged}>
        Guardar
      </button>
    </li>
  );
};

// --- Componente Principal ---
export const EditGuidesPanel = () => {
  const [viewState, setViewState] = useState('guideView');
  const [editedGuides, setEditedGuides] = useState<Guide[]>(mockGuides);
  
  // Estado para creación de nueva guía
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleClick = (action: string) => {
    setViewState(action);
  };

  const handleCreateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setCreateError('Solo se admiten archivos en formato .pdf');
        setNewFile(null);
        return;
      }
      setNewFile(file);
      if (createError) setCreateError(null);
    }
  };

  const handleCreateGuide = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = newTitle.trim();

    if (!trimmedTitle) {
      setCreateError('El título no puede estar vacío.');
      return;
    }

    if (!newCategory) {
      setCreateError('Selecciona una categoría para la guía.');
      return;
    }

    if (!newFile) {
      setCreateError('Debes adjuntar un archivo en formato .pdf.');
      return;
    }

    // Validación de duplicados única por título
    const normalizedInput = trimmedTitle.toLowerCase().replace(/\s+/g, '');
    const isDuplicate = editedGuides.some(
      g => g.title.toLowerCase().replace(/\s+/g, '') === normalizedInput
    );

    if (isDuplicate) {
      setCreateError(`La guía "${trimmedTitle}" ya existe o es equivalente a una existente.`);
      return;
    }

    const createdGuide: Guide = {
      id: Date.now(),
      title: trimmedTitle,
      category: newCategory,
      file: newFile.name // Guardamos la referencia del nombre o File
    };

    setEditedGuides(prev => [...prev, createdGuide]);
    setNewTitle('');
    setNewCategory('');
    setNewFile(null);
    setCreateError(null);
  };

  const handleSaveGuide = (updatedGuide: Guide) => {
    console.log(`Guardando en BD -> ID: ${updatedGuide.id}, Título: ${updatedGuide.title}`);
    setEditedGuides(prev =>
      prev.map(guide => (guide.id === updatedGuide.id ? updatedGuide : guide))
    );
  };

  const handleDeleteGuide = (guideId: number) => {
    setEditedGuides(prev => prev.filter(guide => guide.id !== guideId));
  };

  useEffect(() => {
    if (viewState === 'createView') {
      setNewTitle('');
      setNewCategory('');
      setNewFile(null);
      setCreateError(null);
    }
  }, [viewState]);

  return (
    <div className="edit-panel">
      <h1>Edición de Guías</h1>

      <div className="viewCreateEditGuides">
        <div className="viewButton">
          <button type="button" className={`buttonGuide ${viewState === 'guideView' ? 'active' : ''}`} onClick={() => handleClick('guideView')}>
            Ver Guías
          </button>
          <button type="button" className={`buttonGuide ${viewState === 'createView' ? 'active' : ''}`} onClick={() => handleClick('createView')}>
            Crear Guía
          </button>
          <button type="button" className={`buttonGuide ${viewState === 'editView' ? 'active' : ''}`} onClick={() => handleClick('editView')}>
            Editar Guía
          </button>
          <button type="button" className={`buttonGuide ${viewState === 'deleteView' ? 'active' : ''}`} onClick={() => handleClick('deleteView')}>
            Eliminar Guía
          </button>
        </div>

        {/* --- Ver Guías --- */}
        {viewState === 'guideView' && (
          <div>
            <h3>Listado de Guías</h3>
            <ul className="category-view-list">
              {editedGuides.map(guide => (
                <li key={guide.id}>
                  <span><strong>{guide.title}</strong> — {guide.category}</span>
                  <small>📄 {typeof guide.file === 'string' ? guide.file : guide.file.name}</small>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* --- Crear Guía --- */}
        {viewState === 'createView' && (
          <div>
            <h3>Crear Nueva Guía</h3>
            <form className="create-category-form" onSubmit={handleCreateGuide}>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Título de la guía"
                  value={newTitle}
                  onChange={e => {
                    setNewTitle(e.target.value);
                    if (createError) setCreateError(null);
                  }}
                  className={createError && !newTitle.trim() ? 'input-error' : ''}
                />

                <select value={newCategory} onChange={e => {
                    setNewCategory(e.target.value);
                    if (createError) setCreateError(null);
                  }}
                  className={createError && !newCategory ? 'input-error' : ''}
                >
                  <option value="">Selecciona una categoría</option>
                  {mockCategories.map(cat => (
                    <option key={cat.id} value={cat.title}>
                      {cat.title}
                    </option>
                  ))}
                </select>

                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleCreateFileChange}
                  className={createError && !newFile ? 'input-error' : ''}
                />

                {createError && <span className="error-text">{createError}</span>}
              </div>

              <button type="submit">Crear Guía</button>
            </form>
          </div>
        )}

        {/* --- Editar Guía --- */}
        {viewState === 'editView' && (
          <div>
            <h3>Editar Guías</h3>
            <ul className="edit-category-list">
              {editedGuides.map(guide => (
                <EditGuideRow key={guide.id} guide={guide} guides={editedGuides} categories={mockCategories} onSave={handleSaveGuide}/>
              ))}
            </ul>
          </div>
        )}

        {/* --- Eliminar Guía --- */}
        {viewState === 'deleteView' && (
          <div>
            <h3>Eliminar Guías</h3>
            <ul className="category-view-list">
              {editedGuides.map(guide => (
                <li key={guide.id}>
                  <span>{guide.title} ({guide.category})</span>
                  <button type="button" onClick={() => handleDeleteGuide(guide.id)}>
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};