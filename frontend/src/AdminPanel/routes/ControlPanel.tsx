import './ControlPanel.css';
import { useState } from 'react';
import type { Category, Guide, Quiz } from '../../../types/quizGuides';
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
  const [activeSection, setActiveSection] = useState<'guides' | 'quizzes'>('guides');
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [guides, setGuides] = useState<Guide[]>(initialGuides);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

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
      <h2>Control Panel</h2>

      <div className="control-panel-grid">
        <aside className="control-panel-left">
          <EditCategoriesPanel
            categories={categories}
            onCreate={handleCreateCategory}
            onSave={handleSaveCategory}
            onDelete={handleDeleteCategory}
          />
        </aside>

        <main className="control-panel-right">
          <div className="section-tabs">
            <button
              type="button"
              className={`tab-btn ${activeSection === 'guides' ? 'active' : ''}`}
              onClick={() => setActiveSection('guides')}
            >
              Guías
            </button>
            <button
              type="button"
              className={`tab-btn ${activeSection === 'quizzes' ? 'active' : ''}`}
              onClick={() => setActiveSection('quizzes')}
            >
              Quizzes
            </button>
          </div>

          <div className="section-content">
            {activeSection === 'guides' && (
              <EditGuidesPanel
                categories={categories}
                guides={guides}
                onCreate={handleCreateGuide}
                onSave={handleSaveGuide}
                onDelete={handleDeleteGuide}
              />
            )}
            {activeSection === 'quizzes' && (
              <EditQuizPanel
                categories={categories}
                quizzes={quizzes}
                onCreate={handleCreateQuiz}
                onSave={handleSaveQuiz}
                onDelete={handleDeleteQuiz}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
