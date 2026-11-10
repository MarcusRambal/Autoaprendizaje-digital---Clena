import './ControlPanel.css';
import { useEffect, useState } from 'react';
import type { Category, Guide, Quiz } from '../../../types/contracts';
import { EditCategoriesPanel } from './EditCategoriesPanel';
import { EditGuidesPanel } from './EditGuidesPanel';
import { EditQuizPanel } from './EditQuizPanel';
import {
  apiErrorMessage,
  createGuide,
  createLesson,
  deleteGuide,
  deleteLesson,
  listStaffContent,
  updateGuide,
  updateLesson,
  type LessonInput
} from '../../../services/staffContentApi';

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

const nextId = (items: Array<{ id: number | string }>) =>
  items.reduce((largestId, item) =>
    typeof item.id === 'number' ? Math.max(largestId, item.id) : largestId, 0) + 1;

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
  const usesApi = mode === 'content' && initialData === undefined;
  const [activeSection, setActiveSection] = useState<'categories' | 'guides' | 'quizzes'>(mode === 'categories' ? 'categories' : 'guides');
  const [categories, setCategories] = useState<Category[]>(
    usesApi ? [] : initialData?.categories ?? initialCategories
  );
  const [guides, setGuides] = useState<Guide[]>(initialData?.guides ?? []);
  const [quizzes, setQuizzes] = useState<Quiz[]>(initialData?.quizzes ?? []);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(usesApi);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!usesApi) return;
    let active = true;
    void listStaffContent()
      .then(data => {
        if (!active) return;
        setCategories(data.categories);
        setGuides(data.guides);
        setQuizzes(data.lessons);
        setLoadError(null);
      })
      .catch(error => {
        if (active) setLoadError(apiErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [usesApi]);

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

  const handleDeleteCategory = (categoryId: number | string) => {
    const category = categories.find(item => item.id === categoryId);
    if (!category) return null;

    const isInUse =
      guides.some(guide => guide.category === category.title) ||
      quizzes.some(quiz => quiz.category === category.title);

    if (isInUse) {
      return 'No se puede eliminar esta categoría porque tiene guías o lecciones asociadas.';
    }

    setCategories(current => current.filter(item => item.id !== categoryId));
    return null;
  };

  const handleCreateGuide = async (guide: Omit<Guide, 'id'>) => {
    if (usesApi) {
      if (typeof guide.categoryId !== 'string' || !(guide.file instanceof File)) {
        throw new Error('Selecciona una categoría y un archivo PDF válidos.');
      }
      const saved = await createGuide({ title: guide.title, categoryId: guide.categoryId, file: guide.file });
      setGuides(current => [...current, saved]);
      return;
    }
    setGuides(current => [...current, { ...guide, id: nextId(current) }]);
  };

  const handleSaveGuide = async (updatedGuide: Guide) => {
    if (usesApi) {
      if (typeof updatedGuide.categoryId !== 'string') {
        throw new Error('Selecciona una categoría válida.');
      }
      const saved = await updateGuide(String(updatedGuide.id), {
        title: updatedGuide.title,
        categoryId: updatedGuide.categoryId,
        ...(updatedGuide.file instanceof File ? { file: updatedGuide.file } : {})
      });
      setGuides(current => current.map(guide => guide.id === saved.id ? saved : guide));
      return;
    }
    setGuides(current =>
      current.map(guide => guide.id === updatedGuide.id ? updatedGuide : guide)
    );
  };

  const handleDeleteGuide = async (guideId: number | string) => {
    if (usesApi) await deleteGuide(String(guideId));
    setGuides(current => current.filter(guide => guide.id !== guideId));
  };

  const toLessonInput = (quiz: Omit<Quiz, 'id'>): LessonInput => {
    if (typeof quiz.categoryId !== 'string') throw new Error('Selecciona una categoría válida.');
    return {
      title: quiz.name,
      description: quiz.description,
      categoryId: quiz.categoryId,
      questions: quiz.questions.map(question => ({
        prompt: question.description,
        choices: question.options,
        correctOptionIndex: question.correctOptionIndex,
        immediateFeedback: question.immediateFeedback
      }))
    };
  };

  const handleCreateQuiz = async (quiz: Omit<Quiz, 'id'>) => {
    if (usesApi) {
      const saved = await createLesson(toLessonInput(quiz));
      setQuizzes(current => [...current, saved]);
      return;
    }
    setQuizzes(current => [...current, { ...quiz, id: nextId(current) }]);
  };

  const handleSaveQuiz = async (updatedQuiz: Quiz) => {
    if (usesApi) {
      const saved = await updateLesson(String(updatedQuiz.id), toLessonInput(updatedQuiz));
      setQuizzes(current => current.map(quiz => quiz.id === saved.id ? saved : quiz));
      return;
    }
    setQuizzes(current =>
      current.map(quiz => quiz.id === updatedQuiz.id ? updatedQuiz : quiz)
    );
  };

  const handleDeleteQuiz = async (quizId: number | string) => {
    if (usesApi) await deleteLesson(String(quizId));
    setQuizzes(current => current.filter(quiz => quiz.id !== quizId));
  };

  return (
    <div className="control-panel">
      <header className="control-panel-header">
        <h1>{mode === 'categories' ? 'Categorías' : mode === 'content' ? 'Guías y lecciones' : 'Panel de control'}</h1>
        <p>{mode === 'categories' ? 'Organiza las categorías de la plataforma.' : mode === 'content' ? 'Organiza las guías y lecciones de la plataforma.' : 'Organiza las categorías, guías y lecciones de la plataforma.'}</p>
        {mode !== 'content' && <p role="status"><strong>Demostración:</strong> los datos son de prueba y los cambios no se guardan en el servidor.</p>}
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
        {loading && <p role="status">Cargando contenido…</p>}
        {loadError && <p role="alert">No se pudo cargar el contenido: {loadError}</p>}
        {mode !== 'content' && <div hidden={activeSection !== 'categories'}>
          <EditCategoriesPanel
            categories={categories}
            searchQuery={searchQuery}
            onCreate={handleCreateCategory}
            onSave={handleSaveCategory}
            onDelete={handleDeleteCategory}
          />
        </div>}
        {mode !== 'categories' && <div hidden={activeSection !== 'guides'}>
          <EditGuidesPanel
            categories={categories}
            guides={guides}
            searchQuery={searchQuery}
            onCreate={handleCreateGuide}
            onSave={handleSaveGuide}
            onDelete={handleDeleteGuide}
          />
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
        </div>}
      </div>
    </div>
  );
};
