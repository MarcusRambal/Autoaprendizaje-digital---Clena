import './ControlPanel.css';
import { useState } from 'react';
import type { Category, Guide, Quiz } from '../../../types/contracts';
import { EditCategoriesPanel } from './EditCategoriesPanel';
import { EditGuidesPanel } from './EditGuidesPanel';
import { EditQuizPanel } from './EditQuizPanel';

const initialCategories: Category[] = [
  { id: 1, title: 'Categoria 1' },
  { id: 2, title: 'Categoria 2' },
  { id: 3, title: 'Categoria 3' }
];

const initialGuides: Guide[] = [
  { id: 1, title: 'Guia 1', file: 'guia1.pdf', category: 'Categoria 1' },
  { id: 2, title: 'Guia 2', file: 'guia2.pdf', category: 'Categoria 2' },
  { id: 3, title: 'Guia 3', file: 'guia3.pdf', category: 'Categoria 3' }
];

const nextId = <T extends { id: number }>(items: T[]) =>
  items.reduce((largestId, item) => Math.max(largestId, item.id), 0) + 1;

export const ControlPanel = () => {
  const [activeSection, setActiveSection] = useState<'categories' | 'guides' | 'quizzes'>('guides');
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [guides, setGuides] = useState<Guide[]>(initialGuides);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateCategory = (title: string) => {
    setCategories(current => [...current, { id: nextId(current), title }]);
  };

  const handleSaveCategory = (updatedCategory: Category) => {
    setCategories(current =>
      current.map(category => category.id === updatedCategory.id ? updatedCategory : category)
    );
    setGuides(current =>
      current.map(guide => guide.category === categories.find(category => category.id === updatedCategory.id)?.title
        ? { ...guide, category: updatedCategory.title }
        : guide)
    );
    setQuizzes(current =>
      current.map(quiz => quiz.category === categories.find(category => category.id === updatedCategory.id)?.title
        ? { ...quiz, category: updatedCategory.title }
        : quiz)
    );
  };

  const handleDeleteCategory = (categoryId: number) => {
    const category = categories.find(item => item.id === categoryId);
    if (!category) return null;

    const isInUse =
      guides.some(guide => guide.category === category.title) ||
      quizzes.some(quiz => quiz.category === category.title);

    if (isInUse) {
      return 'No se puede eliminar esta categoría porque tiene guías o quizzes asociados.';
    }

    setCategories(current => current.filter(item => item.id !== categoryId));
    return null;
  };

  const handleCreateGuide = (guide: Omit<Guide, 'id'>) => {
    setGuides(current => [...current, { ...guide, id: nextId(current) }]);
  };

  const handleSaveGuide = (updatedGuide: Guide) => {
    setGuides(current =>
      current.map(guide => guide.id === updatedGuide.id ? updatedGuide : guide)
    );
  };

  const handleDeleteGuide = (guideId: number) => {
    setGuides(current => current.filter(guide => guide.id !== guideId));
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
  };

  return (
    <div className="control-panel">
      <div className="control-panel-search">
        <label htmlFor="control-panel-search">Buscar contenido</label>
        <div className="control-panel-search-controls">
          <input
            id="control-panel-search"
            type="search"
            placeholder="Buscar por nombre o categoría"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')}>Limpiar búsqueda</button>
          )}
        </div>
      </div>
      <div className="section-tabs" role="group" aria-label="Sección del panel de control">
        <button
          type="button"
          className={`tab-btn ${activeSection === 'categories' ? 'active' : ''}`}
          aria-pressed={activeSection === 'categories'}
          onClick={() => setActiveSection('categories')}
        >
          Categorías
        </button>
        <button
          type="button"
          className={`tab-btn ${activeSection === 'guides' ? 'active' : ''}`}
          aria-pressed={activeSection === 'guides'}
          onClick={() => setActiveSection('guides')}
        >
          Guías
        </button>
        <button
          type="button"
          className={`tab-btn ${activeSection === 'quizzes' ? 'active' : ''}`}
          aria-pressed={activeSection === 'quizzes'}
          onClick={() => setActiveSection('quizzes')}
        >
          Quizzes
        </button>
      </div>

      <div className="section-content">
        <div hidden={activeSection !== 'categories'}>
          <EditCategoriesPanel
            categories={categories}
            searchQuery={searchQuery}
            onCreate={handleCreateCategory}
            onSave={handleSaveCategory}
            onDelete={handleDeleteCategory}
          />
        </div>
        <div hidden={activeSection !== 'guides'}>
          <EditGuidesPanel
            categories={categories}
            guides={guides}
            searchQuery={searchQuery}
            onCreate={handleCreateGuide}
            onSave={handleSaveGuide}
            onDelete={handleDeleteGuide}
          />
        </div>
        <div hidden={activeSection !== 'quizzes'}>
          <EditQuizPanel
            categories={categories}
            quizzes={quizzes}
            searchQuery={searchQuery}
            onCreate={handleCreateQuiz}
            onSave={handleSaveQuiz}
            onDelete={handleDeleteQuiz}
          />
        </div>
      </div>
    </div>
  );
};
