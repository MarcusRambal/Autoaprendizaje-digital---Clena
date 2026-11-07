import { useMemo, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { matchesSearch } from '../../../features/content-management/searchContent';
import './Quiz.css';

interface Lesson {
  id: number;
  title: string;
  description: string;
  category: string;
}

interface Question {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const lessons: Lesson[] = [
  {
    id: 1,
    title: 'Navegación segura en internet',
    description: 'Aquí aprenderás cómo navegar de forma segura en internet.',
    category: 'Seguridad digital',
  },
  {
    id: 2,
    title: 'Protege tus cuentas y contraseñas',
    description: 'Aprende a mantener privadas tus claves y a no compartir códigos de acceso.',
    category: 'Seguridad digital',
  },
  {
    id: 3,
    title: 'Potencia tu búsqueda con Google Scholar',
    description: 'Conoce cómo encontrar información para una búsqueda de investigación científica.',
    category: 'Búsqueda en internet',
  },
  {
    id: 4,
    title: 'Reconoce mensajes sospechosos',
    description: 'Aprende a identificar mensajes inesperados antes de abrir enlaces o archivos.',
    category: 'Seguridad digital',
  },
];

const questions: Question[] = [
  {
    prompt: '¿Cuál de estas contraseñas es más segura?',
    options: ['123456', 'gsfksj291@929823j-', 'password', 'Mi nombre y fecha de nacimiento'],
    correctIndex: 1,
    explanation: 'Una contraseña larga, única y difícil de adivinar protege mejor tus cuentas.',
  },
  {
    prompt: 'Una página desconocida te pide tu contraseña. ¿Qué debes hacer?',
    options: ['Escribirla para continuar', 'Usar la misma contraseña de siempre', 'No compartirla y verificar el sitio', 'Enviar una captura de pantalla'],
    correctIndex: 2,
    explanation: 'No escribas tu contraseña en una página que no hayas verificado.',
  },
  {
    prompt: '¿Qué herramienta puedes usar para buscar artículos científicos?',
    options: ['Google Scholar', 'Una cadena de mensajes', 'La carpeta de descargas', 'Un acortador de enlaces'],
    correctIndex: 0,
    explanation: 'Google Scholar ayuda a localizar publicaciones académicas; revisa también quién las publicó y cuándo.',
  },
  {
    prompt: 'Recibes un mensaje urgente que pide un código de acceso. ¿Qué haces?',
    options: ['Lo compartes para evitar un problema', 'Respondes con tu contraseña', 'Verificas la solicitud por un canal oficial', 'Reenvías el código a tus contactos'],
    correctIndex: 2,
    explanation: 'Los códigos de acceso son privados. Confirma la solicitud usando un canal oficial.',
  },
  {
    prompt: '¿Cuál es una buena práctica para tus cuentas?',
    options: ['Usar una sola contraseña en todas', 'Crear contraseñas distintas y guardarlas de forma segura', 'Compartirlas con amistades', 'Anotarlas junto al dispositivo'],
    correctIndex: 1,
    explanation: 'Usar contraseñas distintas evita que una filtración afecte todas tus cuentas.',
  },
  {
    prompt: '¿Qué significa que una página use HTTPS?',
    options: ['Que todo su contenido es confiable', 'Que la conexión está cifrada', 'Que nunca puede ser falsa', 'Que no necesita contraseña'],
    correctIndex: 1,
    explanation: 'HTTPS cifra la conexión, pero aún debes verificar que el sitio sea legítimo.',
  },
  {
    prompt: '¿Qué conviene hacer antes de abrir un archivo inesperado?',
    options: ['Abrirlo rápidamente', 'Revisar quién lo envió y confirmar que sea esperado', 'Compartirlo con otras personas', 'Desactivar las protecciones del dispositivo'],
    correctIndex: 1,
    explanation: 'Confirma con quien supuestamente lo envió antes de abrir archivos inesperados.',
  },
  {
    prompt: '¿Qué añade la verificación en dos pasos a tu cuenta?',
    options: ['Una segunda comprobación al iniciar sesión', 'Una contraseña compartida', 'Acceso automático para cualquiera', 'La eliminación de tu contraseña'],
    correctIndex: 0,
    explanation: 'La verificación en dos pasos agrega una barrera adicional para proteger tu cuenta.',
  },
];

const getSelectedLessonId = (state: unknown): number | undefined => {
  if (!state || typeof state !== 'object' || !('selectedLessonId' in state)) return undefined;
  const { selectedLessonId } = state;
  return typeof selectedLessonId === 'number' ? selectedLessonId : undefined;
};

export const Quiz = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>(() => Array(questions.length).fill(null));
  const [checkedQuestions, setCheckedQuestions] = useState<boolean[]>(() => Array(questions.length).fill(false));
  const [answerError, setAnswerError] = useState<string | null>(null);

  const selectedLessonId = getSelectedLessonId(location.state);
  const selectedLesson = lessons.find(lesson => lesson.id === selectedLessonId);
  const categories = [...new Set(lessons.map(lesson => lesson.category))];
  const filteredLessons = useMemo(() => lessons.filter(lesson =>
    (!category || lesson.category === category)
    && matchesSearch(query, lesson.title, lesson.description, lesson.category)
  ), [category, query]);

  const openLesson = (lesson: Lesson) => {
    setQuestionIndex(0);
    setAnswers(Array(questions.length).fill(null));
    setCheckedQuestions(Array(questions.length).fill(false));
    setAnswerError(null);
    navigate(location.pathname, { state: { selectedLessonId: lesson.id } });
  };

  const currentQuestion = questions[questionIndex];
  const selectedAnswer = answers[questionIndex];
  const isChecked = checkedQuestions[questionIndex];
  const isCorrect = selectedAnswer === currentQuestion.correctIndex;

  const selectAnswer = (answerIndex: number) => {
    setAnswers(current => current.map((answer, index) => index === questionIndex ? answerIndex : answer));
    setCheckedQuestions(current => current.map((checked, index) => index === questionIndex ? false : checked));
    setAnswerError(null);
  };

  const submitAnswer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedAnswer === null) {
      setAnswerError('Selecciona una respuesta antes de comprobarla.');
      return;
    }
    setCheckedQuestions(current => current.map((checked, index) => index === questionIndex ? true : checked));
    setAnswerError(null);
  };

  const changeQuestion = (index: number) => {
    setQuestionIndex(index);
    setAnswerError(null);
  };

  if (selectedLesson) {
    return (
      <section className="public-page lesson-player" aria-label={`Cuestionario: ${selectedLesson.title}`}>
        <p className="lesson-progress">Pregunta {questionIndex + 1} de {questions.length}</p>
        <h1 className="lesson-question-title" id="lesson-question-title">{currentQuestion.prompt}</h1>

        <form className="lesson-quiz-form" onSubmit={submitAnswer}>
          <fieldset className="lesson-answer-group">
            <legend className="visually-hidden">{currentQuestion.prompt}</legend>
            {currentQuestion.options.map((option, index) => {
              const isSelectedWrongAnswer = isChecked
                && selectedAnswer === index
                && selectedAnswer !== currentQuestion.correctIndex;
              const isCorrectAnswer = isChecked && index === currentQuestion.correctIndex;
              const answerClass = [
                'lesson-answer',
                isCorrectAnswer && 'lesson-answer--correct',
                isSelectedWrongAnswer && 'lesson-answer--incorrect',
              ].filter(Boolean).join(' ');

              return (
                <label className={answerClass} key={option}>
                  <input
                    type="radio"
                    name={`question-${questionIndex}`}
                    value={index}
                    checked={selectedAnswer === index}
                    aria-describedby={isChecked ? 'lesson-feedback' : undefined}
                    onChange={() => selectAnswer(index)}
                  />
                  <span className="lesson-answer-label">{String.fromCharCode(65 + index)}.</span>
                  <span>{option}</span>
                </label>
              );
            })}
          </fieldset>

          {(answerError || isChecked) && (
            <p
              className={`lesson-feedback ${isChecked ? isCorrect ? 'lesson-feedback--correct' : 'lesson-feedback--incorrect' : ''}`}
              id="lesson-feedback"
              role={answerError || !isCorrect ? 'alert' : 'status'}
              aria-live="polite"
            >
              {answerError || (isCorrect
                ? `¡Correcto! ${currentQuestion.explanation}`
                : `No es correcto. ${currentQuestion.explanation}`)}
            </p>
          )}

          <div className="lesson-quiz-controls">
            <div className="lesson-question-navigation">
              <button
                className="lesson-navigation-button"
                type="button"
                disabled={questionIndex === 0}
                onClick={() => changeQuestion(questionIndex - 1)}
              >
                ‹ Atrás
              </button>
              <button
                className="lesson-navigation-button"
                type="button"
                disabled={questionIndex === questions.length - 1}
                onClick={() => changeQuestion(questionIndex + 1)}
              >
                Siguiente ›
              </button>
            </div>
            <button
              className={`lesson-check-button${isChecked ? isCorrect ? ' lesson-check-button--correct' : ' lesson-check-button--incorrect' : ''}`}
              type="submit"
            >
              Comprobar respuesta
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                <path d="m4 12 5 5L20 6" />
              </svg>
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="public-page lessons-page" aria-labelledby="lessons-title">
      <header className="lessons-catalog-header">
        <h1 id="lessons-title">Lecciones</h1>
        <div className="lessons-filters">
          <label className="visually-hidden" htmlFor="lesson-search">Buscar lecciones por nombre</label>
          <input
            id="lesson-search"
            type="search"
            placeholder="Búsqueda por nombre"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
          <label className="visually-hidden" htmlFor="lesson-category">Filtrar lecciones por categoría</label>
          <select
            id="lesson-category"
            value={category}
            onChange={event => setCategory(event.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </header>

      <p className="lessons-note">Lecciones de ejemplo disponibles para explorar.</p>

      {filteredLessons.length > 0 ? (
        <div className="lessons-catalog" aria-label="Catálogo de lecciones">
          {filteredLessons.map(lesson => (
            <button
              className="lesson-card"
              key={lesson.id}
              type="button"
              onClick={() => openLesson(lesson)}
            >
              <strong>{lesson.title}</strong>
              <span>{lesson.description}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="lessons-empty" role="status">No se encontraron lecciones con esos filtros.</p>
      )}
    </section>
  );
};
