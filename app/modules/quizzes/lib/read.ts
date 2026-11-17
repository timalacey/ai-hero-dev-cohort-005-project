import { and, desc, eq, inArray } from "drizzle-orm";
import {
  quizAnswers,
  quizAttempts,
  quizOptions,
  quizQuestions,
  quizzes,
} from "~/db/schema";
import type { Db } from "./db";

/** A quiz as a Student sees it: the options carry no answer key. */
export type StudentQuiz = {
  id: number;
  title: string;
  passingScore: number;
  questions: Array<{
    id: number;
    questionText: string;
    questionType: string;
    position: number;
    options: Array<{ id: number; optionText: string }>;
  }>;
};

export function getQuizInLesson(db: Db, quizId: number, lessonId: number) {
  return db
    .select()
    .from(quizzes)
    .where(and(eq(quizzes.id, quizId), eq(quizzes.lessonId, lessonId)))
    .get();
}

export function getStudentQuiz(db: Db, lessonId: number): StudentQuiz | null {
  const quiz = db
    .select()
    .from(quizzes)
    .where(eq(quizzes.lessonId, lessonId))
    .get();
  if (!quiz) return null;

  const questions = db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quiz.id))
    .orderBy(quizQuestions.position)
    .all();

  const options = db
    .select({
      id: quizOptions.id,
      questionId: quizOptions.questionId,
      optionText: quizOptions.optionText,
    })
    .from(quizOptions)
    .where(
      inArray(
        quizOptions.questionId,
        questions.map((question) => question.id)
      )
    )
    .orderBy(quizOptions.id)
    .all();

  return {
    id: quiz.id,
    title: quiz.title,
    passingScore: quiz.passingScore,
    questions: questions.map((question) => ({
      id: question.id,
      questionText: question.questionText,
      questionType: question.questionType,
      position: question.position,
      options: options
        .filter((option) => option.questionId === question.id)
        .map(({ id, optionText }) => ({ id, optionText })),
    })),
  };
}

export function getBestAttempt(db: Db, userId: number, quizId: number) {
  const best = db
    .select()
    .from(quizAttempts)
    .where(
      and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId))
    )
    .orderBy(desc(quizAttempts.score))
    .limit(1)
    .get();
  return best ? { score: best.score, passed: best.passed } : null;
}

/** The options a Student picked in one attempt, by question id. */
export function getAttemptAnswers(db: Db, attemptId: number) {
  const rows = db
    .select()
    .from(quizAnswers)
    .where(eq(quizAnswers.attemptId, attemptId))
    .all();
  return Object.fromEntries(
    rows.map((row) => [row.questionId, row.selectedOptionId])
  );
}
