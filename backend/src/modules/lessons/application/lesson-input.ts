import {
  LESSON_DESCRIPTION_MAX_LENGTH,
  LESSON_FEEDBACK_MAX_LENGTH,
  LESSON_MAX_QUESTIONS,
  LESSON_OPTION_COUNT,
  LESSON_OPTION_MAX_LENGTH,
  LESSON_QUESTION_MAX_LENGTH,
  LESSON_TITLE_MAX_LENGTH,
  LessonContentInput,
  LessonQuestionInput,
} from '../domain/lesson';
import { LessonApplicationError } from './lesson-application.error';

function invalidLesson(message: string): LessonApplicationError {
  return new LessonApplicationError(400, 'INVALID_LESSON', message);
}

export function parseLessonContent(
  input: LessonContentInput,
): LessonContentInput {
  const title = input.title.trim();
  const description = input.description.trim();

  if (!title || title.length > LESSON_TITLE_MAX_LENGTH) {
    throw invalidLesson(
      `Title must contain 1-${LESSON_TITLE_MAX_LENGTH} characters`,
    );
  }
  if (!description || description.length > LESSON_DESCRIPTION_MAX_LENGTH) {
    throw invalidLesson(
      `Description must contain 1-${LESSON_DESCRIPTION_MAX_LENGTH} characters`,
    );
  }
  if (!input.categoryId) {
    throw invalidLesson('A category is required');
  }
  if (
    input.questions.length < 1 ||
    input.questions.length > LESSON_MAX_QUESTIONS
  ) {
    throw invalidLesson(
      `A lesson must contain between 1 and ${LESSON_MAX_QUESTIONS} questions`,
    );
  }

  return {
    title,
    description,
    categoryId: input.categoryId,
    questions: input.questions.map(parseQuestion),
  };
}

function parseQuestion(input: LessonQuestionInput): LessonQuestionInput {
  const prompt = input.prompt.trim();
  const choices = input.choices.map((choice) => choice.trim());
  const immediateFeedback = input.immediateFeedback.trim();

  if (!prompt || prompt.length > LESSON_QUESTION_MAX_LENGTH) {
    throw invalidLesson(
      `Each question must contain 1-${LESSON_QUESTION_MAX_LENGTH} characters`,
    );
  }
  if (
    choices.length !== LESSON_OPTION_COUNT ||
    choices.some(
      (choice) => !choice || choice.length > LESSON_OPTION_MAX_LENGTH,
    ) ||
    new Set(choices).size !== LESSON_OPTION_COUNT
  ) {
    throw invalidLesson(
      `Each question must have ${LESSON_OPTION_COUNT} distinct, non-empty options`,
    );
  }
  if (
    !Number.isInteger(input.correctOptionIndex) ||
    input.correctOptionIndex < 0 ||
    input.correctOptionIndex >= LESSON_OPTION_COUNT
  ) {
    throw invalidLesson('Each question must have exactly one correct option');
  }
  if (
    !immediateFeedback ||
    immediateFeedback.length > LESSON_FEEDBACK_MAX_LENGTH
  ) {
    throw invalidLesson(
      `Feedback must contain 1-${LESSON_FEEDBACK_MAX_LENGTH} characters`,
    );
  }

  return {
    prompt,
    choices,
    correctOptionIndex: input.correctOptionIndex,
    immediateFeedback,
  };
}
