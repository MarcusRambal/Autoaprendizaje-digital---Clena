import './EditCategoriesPanel.css';
import { useState, type FormEvent } from 'react';
import type { Category } from '../../../types/contracts';
import { matchesSearch } from './searchContent';
import { Pagination } from './Pagination';
import { usePagination } from './usePagination';

type ViewState = 'createView' | 'editView' | 'deleteView';

interface EditCategoriesPanelProps {
  categories: Category[];
  searchQuery: string;
  onCreate: (title: string) => void | Promise<void>;
  onSave: (category: Category) => void | Promise<void>;
  onDelete: (categoryId: Category['id']) => string | null | Promise<string | null>;
}

interface EditCategoryRowProps {
  category: Category;
  categories: Category[];
  onSave: (updatedCategory: Category) => void | Promise<void>;
}

const normalizeTitle = (title: string) => title.toLowerCase().replace(/\s+/g, '');

const EditCategoryRow = ({ category, categories, onSave }: EditCategoryRowProps) => {
  const [draftTitle, setDraftTitle] = useState(category.title);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmedTitle = draftTitle.trim();

    if (!trimmedTitle) {
      setError('El nombre no puede estar vacío.');
      return;
    }
    if (trimmedTitle.length > 80) {
      setError('El nombre no puede tener más de 80 caracteres.');
      return;
    }

    const isDuplicate = categories.some(
      item => item.id !== category.id && normalizeTitle(item.title) === normalizeTitle(trimmedTitle)
    );

    if (isDuplicate) {
      setError(`La categoría "${trimmedTitle}" ya existe.`);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onSave({ ...category, title: trimmedTitle });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar la categoría.');
    } finally {
      setSaving(false);
    }
  };

  const isChanged = draftTitle.trim() !== category.title;

  return (
    <li className="edit-category-item">
      <div className="input-group">
        <input
          type="text"
          maxLength={80}
          value={draftTitle}
          aria-label={`Nombre de ${category.title}`}
          onChange={event => {
            setDraftTitle(event.target.value);
            setError(null);
          }}
          className={error ? 'input-error' : ''}
        />
        {error && <span className="error-text" role="alert">{error}</span>}
      </div>
      <button type="button" onClick={handleSave} disabled={!isChanged || saving}>
        {saving ? 'Guardando…' : 'Guardar'}
      </button>
    </li>
  );
};

export const EditCategoriesPanel = ({
  categories,
  searchQuery,
  onCreate,
  onSave,
  onDelete
}: EditCategoriesPanelProps) => {
  const [viewState, setViewState] = useState<ViewState>('createView');
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<Category['id'] | null>(null);
  const filteredCategories = categories.filter(category => matchesSearch(searchQuery, category.title));
  const createdCategoryPages = usePagination(filteredCategories, `created:${searchQuery}`);
  const editCategoryPages = usePagination(filteredCategories, `edit:${searchQuery}`);
  const deleteCategoryPages = usePagination(filteredCategories, `delete:${searchQuery}`);

  const handleCreateCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = newCategoryTitle.trim();

    if (!trimmedTitle) {
      setCreateError('El nombre no puede estar vacío.');
      return;
    }
    if (trimmedTitle.length > 80) {
      setCreateError('El nombre no puede tener más de 80 caracteres.');
      return;
    }

    const isDuplicate = categories.some(
      category => normalizeTitle(category.title) === normalizeTitle(trimmedTitle)
    );

    if (isDuplicate) {
      setCreateError(`La categoría "${trimmedTitle}" ya existe.`);
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      await onCreate(trimmedTitle);
      setNewCategoryTitle('');
    } catch (reason) {
      setCreateError(reason instanceof Error ? reason.message : 'No se pudo crear la categoría.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCategory = async (categoryId: Category['id']) => {
    setDeletingCategoryId(categoryId);
    setDeleteError(null);
    try {
      setDeleteError(await onDelete(categoryId));
    } catch (reason) {
      setDeleteError(reason instanceof Error ? reason.message : 'No se pudo eliminar la categoría.');
    } finally {
      setDeletingCategoryId(null);
    }
  };

  return (
    <div className="edit-panel">
      <h2>Panel de Categorías</h2>
      <p>Modifica y administra las categorías de la plataforma.</p>

      <div className="viewCreateEditGuides">
        <div className="viewButton" role="group" aria-label="Acciones de categorías">
          <button
            type="button"
            className={`buttonGuide ${viewState === 'createView' ? 'active' : ''}`}
            aria-pressed={viewState === 'createView'}
            onClick={() => setViewState('createView')}
          >
            Crear Categoría
          </button>
          <button
            type="button"
            className={`buttonGuide ${viewState === 'editView' ? 'active' : ''}`}
            aria-pressed={viewState === 'editView'}
            onClick={() => setViewState('editView')}
          >
            Editar Categoría
          </button>
          <button
            type="button"
            className={`buttonGuide ${viewState === 'deleteView' ? 'active' : ''}`}
            aria-pressed={viewState === 'deleteView'}
            onClick={() => {
              setDeleteError(null);
              setViewState('deleteView');
            }}
          >
            Eliminar Categoría
          </button>
        </div>

        {viewState === 'createView' && (
          <div className="create-category-container">
            <h3>Crear Nueva Categoría</h3>
            <form className="create-category-form" onSubmit={handleCreateCategory}>
              <div className="input-group">
                <label htmlFor="new-category-title">Nombre de la categoría</label>
                <input
                  id="new-category-title"
                  type="text"
                  maxLength={80}
                  placeholder="Nombre de la categoría"
                  value={newCategoryTitle}
                  onChange={event => {
                    setNewCategoryTitle(event.target.value);
                    setCreateError(null);
                  }}
                  className={createError ? 'input-error' : ''}
                />
                {createError && <span className="error-text" role="alert">{createError}</span>}
              </div>
              <button type="submit" disabled={creating}>
                {creating ? 'Creando…' : 'Crear'}
              </button>
            </form>

            <div className="category-view-container">
              <h3>Categorías Creadas</h3>
              <ul className="category-view-list">
                {createdCategoryPages.items.map(category => <li key={category.id}>{category.title}</li>)}
              </ul>
              <Pagination {...createdCategoryPages} label="Páginas de categorías creadas" />
              {categories.length === 0 && <p>No hay categorías creadas.</p>}
              {categories.length > 0 && filteredCategories.length === 0 && <p role="status">No se encontraron categorías para esta búsqueda.</p>}
            </div>
          </div>
        )}

        {viewState === 'editView' && (
          <div className="edit-category-container">
            <h3 className="edit-category-title">Editar Categorías</h3>
            {categories.length > 0 ? (
              <ul className="edit-category-list">
                {editCategoryPages.items.map(category => (
                  <EditCategoryRow
                    key={`${category.id}-${category.title}`}
                    category={category}
                    categories={categories}
                    onSave={onSave}
                  />
                ))}
              </ul>
            ) : <p>No hay categorías para editar.</p>}
            <Pagination {...editCategoryPages} label="Páginas de categorías para editar" />
            {categories.length > 0 && filteredCategories.length === 0 && <p role="status">No se encontraron categorías para esta búsqueda.</p>}
          </div>
        )}

        {viewState === 'deleteView' && (
          <div className="delete-category-container">
            <h3>Eliminar Categorías</h3>
            {deleteError && <p className="error-text" role="alert">{deleteError}</p>}
            {categories.length > 0 ? (
              <ul className="delete-category-list">
                {deleteCategoryPages.items.map(category => (
                  <li className="delete-category-item" key={category.id}>
                    {category.title}{' '}
                    <button type="button" aria-label={`Eliminar categoría ${category.title}`} onClick={() => handleDeleteCategory(category.id)} disabled={deletingCategoryId === category.id}>
                      {deletingCategoryId === category.id ? 'Eliminando…' : 'Eliminar'}
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p>No hay categorías para eliminar.</p>}
            <Pagination {...deleteCategoryPages} label="Páginas de categorías para eliminar" />
            {categories.length > 0 && filteredCategories.length === 0 && <p role="status">No se encontraron categorías para esta búsqueda.</p>}
          </div>
        )}
      </div>
    </div>
  );
};
