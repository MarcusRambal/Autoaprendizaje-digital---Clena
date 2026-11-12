import './EditQuizPanel.css';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Category, Quiz, QuizQuestion } from '../../../types/contracts';
import { matchesSearch } from './searchContent';
import { Pagination } from './Pagination';
import { usePagination } from './usePagination';
import { isValidQuestion, MAX_QUESTIONS, OPTION_COUNT } from './lessonValidation';
import { apiErrorMessage } from '../../../services/staffContentApi';

type ViewState = 'quizView' | 'createView' | 'editView' | 'editingView' | 'deleteView';
type QuizDraft = Omit<Quiz, 'id'>;

interface EditQuizPanelProps {
  categories: Category[];
  quizzes: Quiz[];
  searchQuery: string;
  onCreate: (quiz: QuizDraft) => void | Promise<void>;
  onSave: (quiz: Quiz) => void | Promise<void>;
  onDelete: (quizId: Quiz['id']) => void | Promise<void>;
}

interface QuizFormProps {
  quiz?: Quiz;
  quizzes: Quiz[];
  categories: Category[];
  onSave: (quiz: QuizDraft, quizId?: Quiz['id']) => void | Promise<void>;
  onCancel: () => void;
}

const emptyQuestion = (): QuizQuestion => ({
  description: '',
  options: ['', '', '', ''],
  correctOptionIndex: 0,
  immediateFeedback: ''
});
const normalizeTitle = (title: string) => title.toLowerCase().replace(/\s+/g, '');

const QuizForm = ({ quiz, quizzes, categories, onSave, onCancel }: QuizFormProps) => {
  const [name, setName] = useState(quiz?.name ?? '');
  const [description, setDescription] = useState(quiz?.description ?? '');
  const [categoryId, setCategoryId] = useState(String(
    quiz?.categoryId ?? categories.find(item => item.title === quiz?.category)?.id ?? ''
  ));
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    () => quiz?.questions.map(question => ({ ...question, options: [...question.options] })) ?? [emptyQuestion()]
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const questionDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const previousQuestionIndex = useRef(questionIndex);
  const question = questions[questionIndex];

  useEffect(() => {
    if (previousQuestionIndex.current !== questionIndex) {
      questionDescriptionRef.current?.focus();
      previousQuestionIndex.current = questionIndex;
    }
  }, [questionIndex]);

  const updateQuestion = (questionIndex: number, update: (question: QuizQuestion) => QuizQuestion) => {
    setQuestions(current => current.map((question, index) =>
      index === questionIndex ? update(question) : question
    ));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('El nombre de la lección no puede estar vacío.');
      return;
    }

    const category = categories.find(item => String(item.id) === categoryId);
    if (!category) {
      setError('Selecciona una categoría válida.');
      return;
    }

    if (questions.length === 0 || questions.length > MAX_QUESTIONS) {
      setError(`La lección debe tener entre 1 y ${MAX_QUESTIONS} preguntas.`);
      return;
    }

    const cleanedQuestions = questions.map(question => ({
      description: question.description.trim(),
      options: question.options.map(option => option.trim()),
      correctOptionIndex: question.correctOptionIndex,
      immediateFeedback: (question.immediateFeedback ?? '').trim()
    }));

    const invalidQuestionIndex = cleanedQuestions.findIndex(question => !isValidQuestion(question));

    if (invalidQuestionIndex !== -1) {
      setQuestionIndex(invalidQuestionIndex);
      setError(`Revisa la pregunta ${invalidQuestionIndex + 1}: debe tener descripción, cuatro opciones distintas, una respuesta correcta y feedback.`);
      return;
    }

    const duplicate = quizzes.some(
      item => item.id !== quiz?.id && normalizeTitle(item.name) === normalizeTitle(trimmedName)
    );

    if (duplicate) {
      setError(`Ya existe una lección llamada "${trimmedName}".`);
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: trimmedName,
        description: description.trim(),
        category: category.title,
        categoryId: category.id,
        questions: cleanedQuestions
      }, quiz?.id);
    } catch (saveError) {
      setError(apiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="quiz-form" onSubmit={handleSubmit}>
      <label>
        Nombre de la lección
        <input
          type="text"
          value={name}
          onChange={event => {
            setName(event.target.value);
            setError(null);
          }}
          placeholder="Nombre de la lección"
        />
      </label>

      <label>
        Descripción de la lección
        <textarea
          value={description}
          onChange={event => {
            setDescription(event.target.value);
            setError(null);
          }}
          placeholder="Describe brevemente la lección"
          rows={3}
        />
      </label>

      <label>
        Categoría
        <select
          value={categoryId}
          onChange={event => {
            setCategoryId(event.target.value);
            setError(null);
          }}
        >
          <option value="">Selecciona una categoría</option>
          {categories.map(item => <option key={item.id} value={String(item.id)}>{item.title}</option>)}
        </select>
      </label>

      <div className="quiz-questions">
        <h3>Preguntas</h3>
        <p>Selecciona una pregunta para modificarla. Máximo {MAX_QUESTIONS} preguntas.</p>
        <div className="quiz-question-selector" role="group" aria-label="Seleccionar pregunta">
          {questions.map((item, index) => (
            <button
              type="button"
              key={index}
              aria-pressed={questionIndex === index}
              onClick={() => {
                setQuestionIndex(index);
                setError(null);
              }}
            >
              Pregunta {index + 1}{item.description.trim() ? `: ${item.description}` : ''}
            </button>
          ))}
        </div>
        <p aria-live="polite">Pregunta {questionIndex + 1} de {questions.length}</p>
        {question && (
          <fieldset className="quiz-question">
            <legend>Pregunta {questionIndex + 1}</legend>
            <label>
              Descripción
              <textarea
                ref={questionDescriptionRef}
                value={question.description}
                onChange={event => {
                  updateQuestion(questionIndex, current => ({ ...current, description: event.target.value }));
                  setError(null);
                }}
                placeholder="Escribe la pregunta"
                rows={3}
              />
            </label>
            <div className="quiz-options">
              <span>Cuatro opciones. Marca una única respuesta correcta.</span>
              {question.options.map((option, optionIndex) => (
                <div className="quiz-option-row" key={optionIndex}>
                  <label className="quiz-correct-option">
                    <input
                      type="radio"
                      name={`correct-answer-${questionIndex}`}
                      aria-label={`Marcar opción ${optionIndex + 1} de pregunta ${questionIndex + 1} como correcta`}
                      checked={question.correctOptionIndex === optionIndex}
                      onChange={() => {
                        updateQuestion(questionIndex, current => ({
                          ...current,
                          correctOptionIndex: optionIndex
                        }));
                        setError(null);
                      }}
                    />
                    Correcta
                  </label>
                  <input
                    type="text"
                    value={option}
                    aria-label={`Opción ${optionIndex + 1} de pregunta ${questionIndex + 1}`}
                    onChange={event => {
                      updateQuestion(questionIndex, current => ({
                        ...current,
                        options: current.options.map((value, index) =>
                          index === optionIndex ? event.target.value : value
                        )
                      }));
                      setError(null);
                    }}
                    placeholder={`Opción ${optionIndex + 1}`}
                  />
                  {question.options.length > OPTION_COUNT && <button
                    type="button"
                    onClick={() => updateQuestion(questionIndex, current => {
                      const correctOptionIndex = current.correctOptionIndex === optionIndex
                        ? Math.min(optionIndex, current.options.length - 2)
                        : current.correctOptionIndex > optionIndex
                          ? current.correctOptionIndex - 1
                          : current.correctOptionIndex;
                      return {
                        ...current,
                        options: current.options.filter((_, index) => index !== optionIndex),
                        correctOptionIndex
                      };
                    })}
                    aria-label={`Eliminar opción ${optionIndex + 1}`}
                  >
                    Quitar
                  </button>}
                </div>
              ))}
              {question.options.length < OPTION_COUNT && <button
                type="button"
                onClick={() => updateQuestion(questionIndex, current => ({
                  ...current,
                  options: [...current.options, '']
                }))}
              >
                Agregar opción
              </button>}
            </div>
            <label>
              Feedback inmediato
              <textarea
                value={question.immediateFeedback}
                onChange={event => {
                  updateQuestion(questionIndex, current => ({
                    ...current,
                    immediateFeedback: event.target.value
                  }));
                  setError(null);
                }}
                placeholder="Explica por qué la respuesta es correcta"
                rows={2}
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setQuestions(current => current.filter((_, index) => index !== questionIndex));
                setQuestionIndex(current => Math.min(current, questions.length - 2));
                setError(null);
              }}
              disabled={questions.length <= 1}
            >
              Eliminar pregunta
            </button>
          </fieldset>
        )}
        <div className="quiz-question-navigation" role="group" aria-label="Navegación de preguntas">
          <button
            type="button"
            disabled={questionIndex === 0}
            onClick={() => {
              setQuestionIndex(current => current - 1);
              setError(null);
            }}
          >
            Pregunta anterior
          </button>
          {questionIndex < questions.length - 1 ? (
            <button type="button" onClick={() => {
              setQuestionIndex(current => current + 1);
              setError(null);
            }}>
              Siguiente pregunta
            </button>
          ) : (
            <button type="button" disabled={questions.length >= MAX_QUESTIONS} onClick={() => {
              setQuestions(current => [...current, emptyQuestion()]);
              setQuestionIndex(questions.length);
              setError(null);
            }}>
              Agregar siguiente pregunta
            </button>
          )}
        </div>
      </div>

      {error && <p className="error-text" role="alert">{error}</p>}
      <div className="quiz-form-actions">
        <button type="submit" disabled={saving}>
          {saving ? 'Guardando…' : quiz ? 'Confirmar edición' : 'Crear lección'}
        </button>
        <button type="button" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
};

export const EditQuizPanel = ({ categories, quizzes, searchQuery, onCreate, onSave, onDelete }: EditQuizPanelProps) => {
  const [viewState, setViewState] = useState<ViewState>('quizView');
  const [editingQuizId, setEditingQuizId] = useState<Quiz['id'] | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleSave = async (quiz: QuizDraft, quizId?: Quiz['id']) => {
    if (quizId === undefined) {
      await onCreate(quiz);
    } else {
      await onSave({ ...quiz, id: quizId });
    }
    setEditingQuizId(null);
    setViewState('quizView');
  };

  const handleDelete = async (quizId: Quiz['id']) => {
    setActionError(null);
    try {
      await onDelete(quizId);
    } catch (error) {
      setActionError(apiErrorMessage(error));
    }
  };

  const editingQuiz = quizzes.find(quiz => quiz.id === editingQuizId);
  const filteredQuizzes = quizzes.filter(quiz => matchesSearch(searchQuery, quiz.name, quiz.category));
  const pagination = usePagination(filteredQuizzes, `${viewState}:${searchQuery}`);

  return (
    <div className="edit-quiz-panel">
      <h2>Gestión de lecciones</h2>
      {actionError && <p className="error-text" role="alert">{actionError}</p>}
      <div className="viewButton" role="group" aria-label="Acciones de lecciones">
        <button
          type="button"
          className={`buttonGuide ${viewState === 'quizView' ? 'active' : ''}`}
          aria-pressed={viewState === 'quizView'}
          onClick={() => {
            setEditingQuizId(null);
            setViewState('quizView');
          }}
        >
          Ver lecciones
        </button>
        <button
          type="button"
          className={`buttonGuide ${viewState === 'createView' ? 'active' : ''}`}
          aria-pressed={viewState === 'createView'}
          onClick={() => {
            setEditingQuizId(null);
            setViewState('createView');
          }}
        >
          Crear lección
        </button>
        <button
          type="button"
          className={`buttonGuide ${viewState === 'editView' || viewState === 'editingView' ? 'active' : ''}`}
          aria-pressed={viewState === 'editView' || viewState === 'editingView'}
          onClick={() => {
            setEditingQuizId(null);
            setViewState('editView');
          }}
        >
          Editar lecciones
        </button>
        <button
          type="button"
          className={`buttonGuide ${viewState === 'deleteView' ? 'active' : ''}`}
          aria-pressed={viewState === 'deleteView'}
          onClick={() => {
            setEditingQuizId(null);
            setViewState('deleteView');
          }}
        >
          Eliminar lecciones
        </button>
      </div>

      {viewState === 'quizView' && (
        <section>
          <h3>Todas las lecciones</h3>
          {quizzes.length > 0 ? pagination.items.map(quiz => (
            <article className="quiz-card" key={quiz.id}>
              <h3>{quiz.name}</h3>
              <p>{quiz.description}</p>
              <p>Categoría: {quiz.category}</p>
              <p>{quiz.questions.length} pregunta(s)</p>
              <ol>
                {quiz.questions.map((question, index) => (
                  <li key={`${quiz.id}-${index}`}>
                    {question.description}
                    <ul>{question.options.map((option, optionIndex) => (
                      <li key={`${quiz.id}-${index}-${optionIndex}`}>
                        {option}{optionIndex === question.correctOptionIndex && ' — Correcta'}
                      </li>
                    ))}</ul>
                  </li>
                ))}
              </ol>
            </article>
          )) : <p>No hay lecciones creadas.</p>}
          {quizzes.length > 0 && filteredQuizzes.length === 0 && <p role="status">No se encontraron lecciones para esta búsqueda.</p>}
          <Pagination {...pagination} label="Páginas de lecciones" />
        </section>
      )}

      {viewState === 'createView' && (
        <section>
          <h3>Crear lección</h3>
          {categories.length > 0 ? (
            <QuizForm
              key="new-quiz"
              quizzes={quizzes}
              categories={categories}
              onSave={handleSave}
              onCancel={() => setViewState('quizView')}
            />
          ) : <p>Crea una categoría antes de agregar lecciones.</p>}
        </section>
      )}

      {viewState === 'editView' && (
        <section>
          <h3>Editar lecciones</h3>
          {quizzes.length > 0 ? (
            <>
              <ul className="quiz-management-list">
                {pagination.items.map(quiz => (
                  <li key={quiz.id}>
                    <span>{quiz.name} ({quiz.category})</span>
                    <button
                      type="button"
                      aria-label={`Editar lección ${quiz.name}`}
                      onClick={() => {
                        setEditingQuizId(quiz.id);
                        setViewState('editingView');
                      }}
                    >
                      Editar
                    </button>
                  </li>
                ))}
              </ul>
              {filteredQuizzes.length === 0 && <p role="status">No se encontraron lecciones para esta búsqueda.</p>}
              <Pagination {...pagination} label="Páginas de lecciones para editar" />
            </>
          ) : <p>No hay lecciones para editar.</p>}
        </section>
      )}

      {viewState === 'editingView' && (
        <section className="lesson-editor" aria-label="Editor de lección">
          {editingQuiz && categories.length > 0 ? (
            <>
              <h3>Editar lección: {editingQuiz.name}</h3>
              <QuizForm
                key={editingQuiz.id}
                quiz={editingQuiz}
                quizzes={quizzes}
                categories={categories}
                onSave={handleSave}
                onCancel={() => {
                  setEditingQuizId(null);
                  setViewState('editView');
                }}
              />
            </>
          ) : <p role="status">No se puede editar esta lección. Comprueba que exista y tenga categorías disponibles.</p>}
        </section>
      )}

      {viewState === 'deleteView' && (
        <section>
          <h3>Eliminar lecciones</h3>
          {quizzes.length > 0 ? (
            <ul className="quiz-management-list">
              {pagination.items.map(quiz => (
                <li key={quiz.id}>
                  <span>{quiz.name} ({quiz.category})</span>
                  <button type="button" aria-label={`Eliminar lección ${quiz.name}`} onClick={() => void handleDelete(quiz.id)}>Eliminar</button>
                </li>
              ))}
            </ul>
          ) : <p>No hay lecciones para eliminar.</p>}
          {quizzes.length > 0 && filteredQuizzes.length === 0 && <p role="status">No se encontraron lecciones para esta búsqueda.</p>}
          <Pagination {...pagination} label="Páginas de lecciones para eliminar" />
        </section>
      )}
    </div>
  );
};
