import { db } from "~/db";
import type { Db } from "./lib/db";
import { createQuiz, type NewQuiz } from "./lib/create";
import {
  calculateGrade,
  gradeQuiz,
  type QuizResult,
  type SelectedAnswers,
} from "./lib/grade";
import {
  getAttemptAnswers,
  getBestAttempt,
  getQuizInLesson,
  getStudentQuiz,
  type StudentQuiz,
} from "./lib/read";

export type { NewQuiz, QuizResult, SelectedAnswers, StudentQuiz };

/** The letter for a score between 0 and 1. */
export function letterGrade(score: number) {
  return calculateGrade(score);
}

/**
 * Lesson quizzes: what a Student sees, and grading their answers. The app
 * uses `quizStore`; tests build their own against a test database.
 */
export function createQuizzes(database: Db) {
  return {
    /** The lesson's quiz without its answer key, or null when it has none. */
    forStudent: (lessonId: number) => getStudentQuiz(database, lessonId),
    /** The Student's highest-scoring attempt, or null before the first one. */
    bestAttempt: (userId: number, quizId: number) =>
      getBestAttempt(database, userId, quizId),
    /** The quiz, only if it belongs to this lesson. */
    findInLesson: (quizId: number, lessonId: number) =>
      getQuizInLesson(database, quizId, lessonId),
    grade: (
      submission: { userId: number; quizId: number; selected: SelectedAnswers },
      now: Date
    ) => gradeQuiz(database, submission, now),
    /** The option picked for each answered question in an attempt. */
    attemptAnswers: (attemptId: number) =>
      getAttemptAnswers(database, attemptId),
    create: (lessonId: number, quiz: NewQuiz) =>
      createQuiz(database, lessonId, quiz),
  };
}

// Pure so a route importing this only for its loader doesn't pull the
// database into the client bundle (see `~/db`).
export const quizStore = /* @__PURE__ */ createQuizzes(db);
