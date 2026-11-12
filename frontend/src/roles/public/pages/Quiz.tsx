import { useCallback, useMemo, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { matchesSearch } from "../../../features/content-management/searchContent";
import { usePublicRequest } from "../../../../services/publicLearning";
import type {
  PublicLesson,
  PublicLessonAnswerResult,
  PublicLessonSummary,
} from "../../../../services/publicLearning";
import {
  checkPublicLessonAnswer,
  getPublicLesson,
  getPublicLessons,
} from "../../../../services/publicLessonApi";
import "./Quiz.css";

const getSelectedLessonId = (state: unknown): number | string | undefined => {
  if (!state || typeof state !== "object" || !("selectedLessonId" in state))
    return undefined;
  const { selectedLessonId } = state;
  return typeof selectedLessonId === "number" ||
    typeof selectedLessonId === "string"
    ? selectedLessonId
    : undefined;
};

const LessonPlayer = ({
  lesson,
  onBack,
}: {
  lesson: PublicLesson;
  onBack: () => void;
}) => {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>(() =>
    Array(lesson.questions.length).fill(null),
  );
  const [checkedAnswers, setCheckedAnswers] = useState<
    Array<PublicLessonAnswerResult | null>
  >(() => Array(lesson.questions.length).fill(null));
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const currentQuestion = lesson.questions[questionIndex];
  const selectedAnswer = answers[questionIndex] ?? null;
  const checkedAnswer = checkedAnswers[questionIndex] ?? null;
  const isChecked = checkedAnswer !== null;

  const selectAnswer = (answerIndex: number) => {
    setAnswers((current) =>
      current.map((answer, index) =>
        index === questionIndex ? answerIndex : answer,
      ),
    );
    setCheckedAnswers((current) =>
      current.map((checked, index) =>
        index === questionIndex ? null : checked,
      ),
    );
    setAnswerError(null);
  };

  const submitAnswer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedAnswer === null || !currentQuestion) {
      setAnswerError("Selecciona una respuesta antes de comprobarla.");
      return;
    }

    setIsChecking(true);
    setAnswerError(null);
    try {
      const result = await checkPublicLessonAnswer(
        lesson.id,
        currentQuestion.id,
        selectedAnswer,
      );
      setCheckedAnswers((current) =>
        current.map((checked, index) =>
          index === questionIndex ? result : checked,
        ),
      );
    } catch (error) {
      setAnswerError(
        error instanceof Error
          ? error.message
          : "No se pudo comprobar la respuesta. Inténtalo de nuevo.",
      );
    } finally {
      setIsChecking(false);
    }
  };

  const changeQuestion = (index: number) => {
    setQuestionIndex(index);
    setAnswerError(null);
  };

  if (!currentQuestion) {
    return (
      <section
        className="public-page lesson-player"
        aria-label={`Lección: ${lesson.title}`}
      >
        <p role="status">Esta lección todavía no tiene preguntas.</p>
        <button
          className="public-button public-button--secondary"
          type="button"
          onClick={onBack}
        >
          Volver a las lecciones
        </button>
      </section>
    );
  }

  return (
    <section
      className="public-page lesson-player"
      aria-labelledby="lesson-title"
    >
      <header className="lesson-player-header">
        <button
          className="public-button public-button--secondary"
          type="button"
          onClick={onBack}
        >
          Volver a las lecciones
        </button>
        <span className="public-eyebrow">{lesson.category}</span>
        <h1 id="lesson-title">{lesson.title}</h1>
        <p>{lesson.description}</p>
      </header>
      <div className="lesson-progress">
        <span>
          Pregunta {questionIndex + 1} de {lesson.questions.length}
        </span>
        <progress
          value={questionIndex + 1}
          max={lesson.questions.length}
          aria-label={`Progreso de la lección: pregunta ${questionIndex + 1} de ${lesson.questions.length}`}
        />
      </div>
      <h1 className="lesson-question-title" id="lesson-question-title">
        {currentQuestion.prompt}
      </h1>

      <form className="lesson-quiz-form" onSubmit={submitAnswer}>
        <fieldset className="lesson-answer-group">
          <legend className="visually-hidden">{currentQuestion.prompt}</legend>
          {currentQuestion.options.map((option, index) => {
            const isSelectedWrongAnswer =
              isChecked && selectedAnswer === index && !checkedAnswer?.correct;
            const isCorrectAnswer =
              isChecked && selectedAnswer === index && checkedAnswer?.correct;
            const answerClass = [
              "lesson-answer",
              isCorrectAnswer && "lesson-answer--correct",
              isSelectedWrongAnswer && "lesson-answer--incorrect",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <label className={answerClass} key={option}>
                <input
                  type="radio"
                  name={`question-${questionIndex}`}
                  value={index}
                  checked={selectedAnswer === index}
                  aria-describedby={
                    isChecked || answerError ? "lesson-feedback" : undefined
                  }
                  disabled={isChecking}
                  onChange={() => selectAnswer(index)}
                />
                <span className="lesson-answer-label">
                  {String.fromCharCode(65 + index)}.
                </span>
                <span>{option}</span>
                {isChecked && (isCorrectAnswer || isSelectedWrongAnswer) && (
                  <span className="lesson-answer-result">
                    {isCorrectAnswer ? "Respuesta correcta" : "Tu respuesta"}
                  </span>
                )}
              </label>
            );
          })}
        </fieldset>

        {(answerError || isChecked) && (
          <p
            className={`lesson-feedback ${isChecked ? (checkedAnswer?.correct ? "lesson-feedback--correct" : "lesson-feedback--incorrect") : ""}`}
            id="lesson-feedback"
            role={answerError || !checkedAnswer?.correct ? "alert" : "status"}
            aria-live="polite"
          >
            {answerError ||
              (checkedAnswer?.correct
                ? `¡Correcto! ${checkedAnswer.immediateFeedback}`
                : `No es correcto. ${checkedAnswer?.immediateFeedback ?? ""}`)}
          </p>
        )}
        {isChecking && <p role="status">Comprobando respuesta…</p>}

        <div className="lesson-quiz-controls">
          <div className="lesson-question-navigation">
            <button
              className="lesson-navigation-button"
              type="button"
              disabled={questionIndex === 0 || isChecking}
              onClick={() => changeQuestion(questionIndex - 1)}
            >
              ‹ Atrás
            </button>
            <button
              className="lesson-navigation-button"
              type="button"
              disabled={
                questionIndex === lesson.questions.length - 1 || isChecking
              }
              onClick={() => changeQuestion(questionIndex + 1)}
            >
              Siguiente ›
            </button>
          </div>
          <button
            className={`lesson-check-button${isChecked ? (checkedAnswer?.correct ? " lesson-check-button--correct" : " lesson-check-button--incorrect") : ""}`}
            type="submit"
            disabled={isChecking}
          >
            {isChecking ? "Comprobando…" : "Comprobar respuesta"}
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path d="m4 12 5 5L20 6" />
            </svg>
          </button>
        </div>
      </form>
    </section>
  );
};

export const Quiz = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    data: lessons,
    isLoading,
    error,
  } = usePublicRequest(getPublicLessons);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const selectedLessonId = getSelectedLessonId(location.state);
  const loadSelectedLesson = useCallback(
    () =>
      selectedLessonId === undefined
        ? Promise.resolve(null)
        : getPublicLesson(selectedLessonId),
    [selectedLessonId],
  );
  const {
    data: selectedLessonResult,
    isLoading: isLessonLoading,
    error: lessonError,
  } = usePublicRequest(loadSelectedLesson);
  const selectedLesson =
    selectedLessonResult?.id === selectedLessonId ? selectedLessonResult : null;
  const categories = [
    ...new Set((lessons ?? []).map((lesson) => lesson.category)),
  ];
  const filteredLessons = useMemo(
    () =>
      (lessons ?? []).filter(
        (lesson) =>
          (!category || lesson.category === category) &&
          matchesSearch(
            query,
            lesson.title,
            lesson.description,
            lesson.category,
          ),
      ),
    [category, lessons, query],
  );

  const openLesson = (lesson: PublicLessonSummary) => {
    navigate(location.pathname, { state: { selectedLessonId: lesson.id } });
  };

  if (selectedLessonId !== undefined) {
    if (lessonError) {
      return (
        <section className="public-page lesson-player" aria-label="Lección">
          <p className="public-error" role="alert">
            {lessonError}
          </p>
          <button
            className="public-button public-button--secondary"
            type="button"
            onClick={() =>
              navigate(location.pathname, { replace: true, state: null })
            }
          >
            Volver a las lecciones
          </button>
        </section>
      );
    }
    if (isLessonLoading || !selectedLesson) {
      return (
        <section className="public-page lesson-player" aria-label="Lección">
          <p role="status">Cargando lección…</p>
        </section>
      );
    }
    return (
      <LessonPlayer
        key={selectedLesson.id}
        lesson={selectedLesson}
        onBack={() =>
          navigate(location.pathname, { replace: true, state: null })
        }
      />
    );
  }

  return (
    <section
      className="public-page lessons-page"
      aria-labelledby="lessons-title"
    >
      <header className="lessons-catalog-header">
        <h1 id="lessons-title">Lecciones</h1>
        <div className="lessons-filters">
          <label className="visually-hidden" htmlFor="lesson-search">
            Buscar lecciones por nombre
          </label>
          <input
            id="lesson-search"
            type="search"
            placeholder="Búsqueda por nombre"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <label className="visually-hidden" htmlFor="lesson-category">
            Filtrar lecciones por categoría
          </label>
          <select
            id="lesson-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </header>

      <p className="public-demo-note" role="note">
        Lecciones publicadas por el equipo de Staff. El progreso todavía no se
        guarda.
      </p>
      {isLoading && <p role="status">Cargando lecciones…</p>}
      {error && (
        <p className="public-error" role="alert">
          {error}
        </p>
      )}

      {!isLoading && !error && filteredLessons.length > 0 ? (
        <div className="lessons-catalog" aria-label="Catálogo de lecciones">
          {filteredLessons.map((lesson) => (
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
      ) : !isLoading && !error ? (
        <p className="lessons-empty" role="status">
          No se encontraron lecciones con esos filtros.
        </p>
      ) : null}
    </section>
  );
};
