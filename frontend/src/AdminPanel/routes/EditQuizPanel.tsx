import './EditQuizPanel.css';
import { useState, type FormEvent } from 'react';
import type { Category, Quiz, QuizQuestion } from '../../../types/quizGuides';

type ViewState = 'quizView' | 'createView' | 'editView' | 'deleteView';
type QuizDraft = Omit<Quiz, 'id'>;

interface EditQuizPanelProps {
  categories: Category[];
  quizzes: Quiz[];
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
  options: ['', ''],
  correctOptionIndex: 0
});
const normalizeTitle = (title: string) => title.toLowerCase().replace(/\s+/g, '');

const QuizForm = ({ quiz, quizzes, categories, onSave, onCancel }: QuizFormProps) => {
  const [name, setName] = useState(quiz?.name ?? '');
  const [category, setCategory] = useState(quiz?.category ?? '');
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    () => quiz?.questions.map(question => ({ ...question, options: [...question.options] })) ?? [emptyQuestion()]
  );
  const [error, setError] = useState<string | null>(null);

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

    const invalidQuestion = cleanedQuestions.some(
      question =>
        !question.description ||
        question.options.length < 2 ||
        question.options.some(option => !option) ||
        !Number.isInteger(question.correctOptionIndex) ||
        question.correctOptionIndex < 0 ||
        question.correctOptionIndex >= question.options.length
    );

    if (invalidQuestion) {
      setError('Cada pregunta debe tener descripción, dos opciones completas y una respuesta correcta.');
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
        {questions.map((question, questionIndex) => (
          <fieldset className="quiz-question" key={questionIndex}>
            <legend>Pregunta {questionIndex + 1}</legend>
            <label>
              Descripción
              <textarea
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
              <span>Opciones</span>
              {question.options.map((option, optionIndex) => (
                <div className="quiz-option-row" key={optionIndex}>
                  <label className="quiz-correct-option">
                    <input
                      type="radio"
                      name={`correct-answer-${questionIndex}`}
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
              onClick={() => setQuestions(current => current.filter((_, index) => index !== questionIndex))}
              disabled={questions.length <= 1}
            >
              Eliminar pregunta
            </button>
          </fieldset>
        ))}
        <button type="button" onClick={() => setQuestions(current => [...current, emptyQuestion()])}>
          Agregar pregunta
        </button>
      </div>

      {error && <p className="error-text" role="alert">{error}</p>}
      <div className="quiz-form-actions">
        <button type="submit">{quiz ? 'Guardar cambios' : 'Crear quiz'}</button>
        <button type="button" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
};

export const EditQuizPanel = ({ categories, quizzes, onCreate, onSave, onDelete }: EditQuizPanelProps) => {
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

  return (
    <div className="edit-quiz-panel">
      <h1>Administración de Quizzes</h1>
      <div className="viewButton">
        <button
          type="button"
          className={`buttonGuide ${viewState === 'quizView' ? 'active' : ''}`}
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
          {quizzes.length > 0 ? quizzes.map(quiz => (
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
                {quizzes.map(quiz => (
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
              {quizzes.map(quiz => (
                <li key={quiz.id}>
                  <span>{quiz.name} ({quiz.category})</span>
                  <button type="button" onClick={() => onDelete(quiz.id)}>Eliminar</button>
                </li>
              ))}
            </ul>
          ) : <p>No hay quizzes para eliminar.</p>}
        </section>
      )}
    </div>
  );
};
