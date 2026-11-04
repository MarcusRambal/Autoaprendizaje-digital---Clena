import './EditQuizPanel.css';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Category, Quiz, QuizQuestion } from '../../../types/contracts';
import { matchesSearch } from './searchContent';

type ViewState = 'quizView' | 'createView' | 'editView' | 'deleteView';
type QuizDraft = Omit<Quiz, 'id'>;

interface EditQuizPanelProps {
  categories: Category[];
  quizzes: Quiz[];
  searchQuery: string;
  onCreate: (quiz: QuizDraft) => void;
  onSave: (quiz: Quiz) => void;
  onDelete: (quizId: number) => void;
}

interface QuizFormProps {
  quiz?: Quiz;
  quizzes: Quiz[];
  categories: Category[];
  onSave: (quiz: QuizDraft, quizId?: number) => void;
  onCancel: () => void;
}

const emptyQuestion = (): QuizQuestion => ({
  description: '',
  options: ['', '', '', ''],
  correctOptionIndex: 0
});
const normalizeTitle = (title: string) => title.toLowerCase().replace(/\s+/g, '');

const QuizForm = ({ quiz, quizzes, categories, onSave, onCancel }: QuizFormProps) => {
  const [name, setName] = useState(quiz?.name ?? '');
  const [category, setCategory] = useState(quiz?.category ?? '');
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    () => quiz?.questions.map(question => ({ ...question, options: [...question.options] })) ?? [emptyQuestion()]
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('El nombre del quiz no puede estar vacío.');
      return;
    }

    if (!categories.some(item => item.title === category)) {
      setError('Selecciona una categoría válida.');
      return;
    }

    if (questions.length === 0) {
      setError('Agrega al menos una pregunta.');
      return;
    }

    const cleanedQuestions = questions.map(question => ({
      description: question.description.trim(),
      options: question.options.map(option => option.trim()),
      correctOptionIndex: question.correctOptionIndex
    }));

    const invalidQuestionIndex = cleanedQuestions.findIndex(
      question =>
        !question.description ||
        question.options.length < 2 ||
        question.options.some(option => !option) ||
        !Number.isInteger(question.correctOptionIndex) ||
        question.correctOptionIndex < 0 ||
        question.correctOptionIndex >= question.options.length
    );

    if (invalidQuestionIndex !== -1) {
      setQuestionIndex(invalidQuestionIndex);
      setError(`Revisa la pregunta ${invalidQuestionIndex + 1}: debe tener descripción, dos opciones completas y una respuesta correcta.`);
      return;
    }

    const duplicate = quizzes.some(
      item => item.id !== quiz?.id && normalizeTitle(item.name) === normalizeTitle(trimmedName)
    );

    if (duplicate) {
      setError(`Ya existe un quiz llamado "${trimmedName}".`);
      return;
    }

    onSave({ name: trimmedName, category, questions: cleanedQuestions }, quiz?.id);
  };

  return (
    <form className="quiz-form" onSubmit={handleSubmit}>
      <label>
        Nombre del quiz
        <input
          type="text"
          value={name}
          onChange={event => {
            setName(event.target.value);
            setError(null);
          }}
          placeholder="Nombre del quiz"
        />
      </label>

      <label>
        Categoría
        <select
          value={category}
          onChange={event => {
            setCategory(event.target.value);
            setError(null);
          }}
        >
          <option value="">Selecciona una categoría</option>
          {categories.map(item => <option key={item.id} value={item.title}>{item.title}</option>)}
        </select>
      </label>

      <div className="quiz-questions">
        <h3>Preguntas</h3>
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
              <span>Opciones (cuatro por defecto; puedes agregar o quitar opciones). Marca la respuesta correcta.</span>
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
                  <button
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
                    disabled={question.options.length <= 2}
                    aria-label={`Eliminar opción ${optionIndex + 1}`}
                  >
                    Quitar
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => updateQuestion(questionIndex, current => ({
                  ...current,
                  options: [...current.options, '']
                }))}
              >
                Agregar opción
              </button>
            </div>
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
            <button type="button" onClick={() => {
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
        <button type="submit">{quiz ? 'Guardar cambios' : 'Crear quiz'}</button>
        <button type="button" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
};

export const EditQuizPanel = ({ categories, quizzes, searchQuery, onCreate, onSave, onDelete }: EditQuizPanelProps) => {
  const [viewState, setViewState] = useState<ViewState>('quizView');
  const [editingQuizId, setEditingQuizId] = useState<number | null>(null);

  const handleSave = (quiz: QuizDraft, quizId?: number) => {
    if (quizId === undefined) {
      onCreate(quiz);
    } else {
      onSave({ ...quiz, id: quizId });
    }
    setEditingQuizId(null);
    setViewState('quizView');
  };

  const editingQuiz = quizzes.find(quiz => quiz.id === editingQuizId);
  const filteredQuizzes = quizzes.filter(quiz => matchesSearch(searchQuery, quiz.name, quiz.category));

  return (
    <div className="edit-quiz-panel">
      <h2>Administración de Quizzes</h2>
      <div className="viewButton" role="group" aria-label="Acciones de quizzes">
        <button
          type="button"
          className={`buttonGuide ${viewState === 'quizView' ? 'active' : ''}`}
          aria-pressed={viewState === 'quizView'}
          onClick={() => {
            setEditingQuizId(null);
            setViewState('quizView');
          }}
        >
          Ver Quizzes
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
          Crear Quiz
        </button>
        <button
          type="button"
          className={`buttonGuide ${viewState === 'editView' ? 'active' : ''}`}
          aria-pressed={viewState === 'editView'}
          onClick={() => {
            setEditingQuizId(null);
            setViewState('editView');
          }}
        >
          Editar Quiz
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
          Eliminar Quiz
        </button>
      </div>

      {viewState === 'quizView' && (
        <section>
          <h2>Listado de Quizzes</h2>
          {quizzes.length > 0 ? filteredQuizzes.map(quiz => (
            <article className="quiz-card" key={quiz.id}>
              <h3>{quiz.name}</h3>
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
          )) : <p>No hay quizzes creados.</p>}
          {quizzes.length > 0 && filteredQuizzes.length === 0 && <p role="status">No se encontraron quizzes para esta búsqueda.</p>}
        </section>
      )}

      {viewState === 'createView' && (
        <section>
          <h2>Crear Quiz</h2>
          {categories.length > 0 ? (
            <QuizForm
              key="new-quiz"
              quizzes={quizzes}
              categories={categories}
              onSave={handleSave}
              onCancel={() => setViewState('quizView')}
            />
          ) : <p>Crea una categoría antes de agregar quizzes.</p>}
        </section>
      )}

      {viewState === 'editView' && (
        <section>
          <h2>Editar Quizzes</h2>
          {quizzes.length > 0 ? (
            <>
              <ul className="quiz-management-list">
                {filteredQuizzes.map(quiz => (
                  <li key={quiz.id}>
                    <span>{quiz.name} ({quiz.category})</span>
                    <button
                      type="button"
                      onClick={() => setEditingQuizId(quiz.id)}
                    >
                      Editar
                    </button>
                  </li>
                ))}
              </ul>
              {filteredQuizzes.length === 0 && <p role="status">No se encontraron quizzes para esta búsqueda.</p>}
              {editingQuiz && categories.length > 0 && (
                <QuizForm
                  key={editingQuiz.id}
                  quiz={editingQuiz}
                  quizzes={quizzes}
                  categories={categories}
                  onSave={handleSave}
                  onCancel={() => setEditingQuizId(null)}
                />
              )}
            </>
          ) : <p>No hay quizzes para editar.</p>}
        </section>
      )}

      {viewState === 'deleteView' && (
        <section>
          <h2>Eliminar Quizzes</h2>
          {quizzes.length > 0 ? (
            <ul className="quiz-management-list">
              {filteredQuizzes.map(quiz => (
                <li key={quiz.id}>
                  <span>{quiz.name} ({quiz.category})</span>
                  <button type="button" aria-label={`Eliminar quiz ${quiz.name}`} onClick={() => onDelete(quiz.id)}>Eliminar</button>
                </li>
              ))}
            </ul>
          ) : <p>No hay quizzes para eliminar.</p>}
          {quizzes.length > 0 && filteredQuizzes.length === 0 && <p role="status">No se encontraron quizzes para esta búsqueda.</p>}
        </section>
      )}
    </div>
  );
};
