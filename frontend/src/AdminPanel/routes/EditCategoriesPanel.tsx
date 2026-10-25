// AdminPanel/routes/EditPanel.tsx
import './EditCategoriesPanel.css';
import { useState, useEffect } from 'react';
import type { Category } from '../../../types/contracts';

const mockCategories: Category[] = [
  { id: 1, title: 'Categoria 1' },
  { id: 2, title: 'Categoria 2' },
  { id: 3, title: 'Categoria 3' }
];

interface EditCategoryRowProps {
  category: Category;
  categories: Category[];
  onSave: (updatedCategory: Category) => void;
}

const EditCategoryRow = ({ category, categories, onSave }: EditCategoryRowProps) => {
  const [draftTitle, setDraftTitle] = useState(category.title);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraftTitle(category.title);
  }, [category.title]);

  const handleSave = () => {
    const trimmedTitle = draftTitle.trim();

    // 1. Validación de campo vacío
    if (!trimmedTitle) {
      setError('El nombre no puede estar vacío.');
      return;
    }

    // 2. Validación de duplicados (excluyendo la misma categoría)
    const isDuplicate = categories.some(cat => cat.id !== category.id && cat.title.toLowerCase() === trimmedTitle.toLowerCase());

    if (isDuplicate) {
      setError(`La categoría "${trimmedTitle}" ya existe.`);
      return;
    }

    setError(null);
    onSave({ ...category, title: trimmedTitle });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraftTitle(e.target.value);
    if (error) setError(null); 
  };

  const isChanged = draftTitle.trim() !== category.title;

  return (
    <li className="edit-category-item">
      <div className="input-group">
        <input
          type="text"
          value={draftTitle}
          onChange={handleChange}
          className={error ? 'input-error' : ''}
        />
        {error && <span className="error-text">{error}</span>}
      </div>

      <button type="button" onClick={handleSave} disabled={!isChanged}>Guardar</button>
    </li>
  );
};

// --- Componente Principal ---
export const EditCategoriesPanel = () => {
  const [viewState, setViewState] = useState('categoryView');
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [editedCategories, setEditedCategories] = useState<Category[]>(mockCategories);

  const handleClick = (action: string) => {
    setViewState(action);
  };

  const handleCreateCategory = (e: React.SubmitEvent<HTMLFormElement>) => {
  e.preventDefault();
  const trimmedTitle = newCategoryTitle.trim();

  if (!trimmedTitle) {
    setCreateError('El nombre no puede estar vacío.');
    return;
  }

  const normalizedInput = trimmedTitle.toLowerCase().replace(/\s+/g, '');

  const isDuplicate = editedCategories.some(cat => {
    const normalizedCatTitle = cat.title.toLowerCase().replace(/\s+/g, '');
    return normalizedCatTitle === normalizedInput;
  });

  if (isDuplicate) {
    setCreateError(`La categoría "${trimmedTitle}" ya existe o es equivalente a una existente.`);
    return;
  }

  const newCat = { id: Date.now(), title: trimmedTitle };
  setEditedCategories(prev => [...prev, newCat]);
  setNewCategoryTitle('');
  setCreateError(null);
};

  // Actualización persistente al presionar Guardar
  const handleSaveCategory = (updatedCategory: Category) => {
    console.log(`Guardando en BD -> ID: ${updatedCategory.id}, Título: ${updatedCategory.title}`);
    
    // 1. Actualiza el estado en memoria
    setEditedCategories(prev =>prev.map(cat => (cat.id === updatedCategory.id ? updatedCategory : cat)));

    // 2. Aquí realizas la petición HTTP al backend (PUT/PATCH)
    // await api.updateCategory(updatedCategory.id, { title: updatedCategory.title });
  };

  const handleDeleteCategory = (categoryId: number) => {
    setEditedCategories(prev => prev.filter(cat => cat.id !== categoryId));
  };

  useEffect(() => {
    if (viewState === 'createView') {
      setNewCategoryTitle('');
      setCreateError(null);
    }
  }, [viewState]);

  return (
    <div className="edit-panel">
      <h1>Panel de Categorías</h1>
      <p>Modifica y administra las categorías de la plataforma.</p>
      
      <div className="viewCreateEditGuides">
        <div className="viewButton">
          <button type="button" className={`buttonGuide ${viewState === 'createView' ? 'active' : ''}`} onClick={() => handleClick('createView')}>
            Crear Categoría
          </button>
          <button type="button" className={`buttonGuide ${viewState === 'editView' ? 'active' : ''}`} onClick={() => handleClick('editView')}>
            Editar Categoría
          </button>
          <button type="button" className={`buttonGuide ${viewState === 'deleteView' ? 'active' : ''}`} onClick={() => handleClick('deleteView')}>
            Eliminar Categoría
          </button>
        </div>

        {/* --- Crear Categoría --- */}
        {viewState === 'createView' && (
          <div className="create-category-container">
            <h3>Crear Nueva Categoría</h3>
            <form className="create-category-form" onSubmit={handleCreateCategory}>
              <div className="input-group">
                <input type="text"
                  placeholder="Nombre de la categoría" value={newCategoryTitle} onChange={e => { setNewCategoryTitle(e.target.value);
                    if (createError) setCreateError(null);
                  }}
                  className={createError ? 'input-error' : ''}
                />
                {createError && <span className="error-text">{createError}</span>}
              </div>
              <button type="submit">Crear</button>
            </form>

            <div className="category-view-container">
            <h3>Categorías Creadas</h3>
            <ul className="category-view-list">
              {editedCategories.map(category => (
                <li key={category.id}>{category.title}</li>
              ))}
            </ul>
          </div>
          </div>
        )}

        {/* --- Editar Categoría --- */}
        {viewState === 'editView' && (
          <div className="edit-category-container">
            <h3 className="edit-category-title">Editar Categorías</h3>
            <ul className="edit-category-list">
              {editedCategories.map(category => (
                <EditCategoryRow key={category.id} category={category} categories={editedCategories} onSave={handleSaveCategory}/>
              ))}
            </ul>
          </div>
        )}

        {/* --- Eliminar Categoría --- */}
        {viewState === 'deleteView' && (
          <div className="delete-category-container">
            <h3>Eliminar Categorías</h3>
            <ul className="delete-category-list">
              {editedCategories.map(category => (
                <li className="delete-category-item" key={category.id}>
                  {category.title}{' '}
                  <button type="button" onClick={() => handleDeleteCategory(category.id)}>
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