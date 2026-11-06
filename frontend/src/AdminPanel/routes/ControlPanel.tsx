import './ControlPanel.css';
import { useState } from 'react';
import type { Category, Guide, Quiz } from '../../../types/contracts';
import { EditCategoriesPanel } from './EditCategoriesPanel';
import { EditGuidesPanel } from './EditGuidesPanel';
import { EditQuizPanel } from './EditQuizPanel';

const initialCategories: Category[] = [
  { id: 1, title: 'Categoria 1' },
  { id: 2, title: 'Categoria 2' },
  { id: 3, title: 'Categoria 3' },
  { id: 4, title: 'Categoria 4' },
  { id: 5, title: 'Categoria 5' },
  { id: 6, title: 'Categoria 6' },
  { id: 7, title: 'Categoria 7' },
  { id: 8, title: 'Categoria 8' },
  { id: 9, title: 'Categoria 9' },
  { id: 10, title: 'Categoria 10' }
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



const nextId = <T extends { id: number }>(items: T[]) =>
  items.reduce((largestId, item) => Math.max(largestId, item.id), 0) + 1;

interface ControlPanelData {
  categories: Category[];
  guides: Guide[];
  quizzes: Quiz[];
}

interface ControlPanelProps {
  initialData?: ControlPanelData;
}

export const ControlPanel = ({ initialData }: ControlPanelProps) => {
  const [activeSection, setActiveSection] = useState<'categories' | 'guides' | 'quizzes'>('guides');
  const [categories, setCategories] = useState<Category[]>(initialData?.categories ?? initialCategories);
  const [guides, setGuides] = useState<Guide[]>(initialData?.guides ?? initialGuides);
  const [quizzes, setQuizzes] = useState<Quiz[]>(initialData?.quizzes ?? []);
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
      <header className="control-panel-header">
        <h1>Panel de control</h1>
        <p>Organiza las categorías, guías y quizzes de la plataforma.</p>
      </header>
      <div className="control-panel-toolbar">
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
