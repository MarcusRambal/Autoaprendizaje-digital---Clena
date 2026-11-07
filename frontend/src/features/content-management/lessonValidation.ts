import type { QuizQuestion } from '../../../types/contracts';

export const MAX_QUESTIONS = 8;
export const OPTION_COUNT = 4;

export function isValidQuestion(question: QuizQuestion) {
  return question.description.trim().length > 0 &&
    question.options.length === OPTION_COUNT &&
    question.options.every(option => option.trim().length > 0) &&
    Number.isInteger(question.correctOptionIndex) &&
    question.correctOptionIndex >= 0 &&
    question.correctOptionIndex < OPTION_COUNT;
}
