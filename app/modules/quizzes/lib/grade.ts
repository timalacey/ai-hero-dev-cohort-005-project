import { and, eq, inArray } from "drizzle-orm";
import {
  QuestionType,
  quizAnswers,
  quizAttempts,
  quizOptions,
  quizQuestions,
} from "~/db/schema";
import type { Db } from "./db";

/** Question id to the option id the Student picked. */
export type SelectedAnswers = Record<number, number>;

export type QuestionResult = {
  questionId: number;
  correct: boolean;
  selectedOptionId: number | null;
  correctOptionId: number | null;
};

export type QuizResult = {
  attemptId: number;
  score: number;
  passed: boolean;
  grade: string;
  totalCorrect: number;
  totalQuestions: number;
  questionResults: QuestionResult[];
};

/** A Student passes with a score strictly above this, whatever the quiz's own passing score says. */
const PASS_ABOVE = 0.7;

const GRADED_TYPES: string[] = [
  QuestionType.MultipleChoice,
  QuestionType.TrueFalse,
];

export function calculateGrade(score: number): string {
  if (score >= 0.9) return "A";
  if (score >= 0.8) return "B";
  if (score >= 0.7) return "C";
  if (score >= 0.6) return "D";
  return "F";
}

/** Question id to its correct option id; the first one if a question has several. */
function getAnswerKey(db: Db, questionIds: number[]) {
  const rows = db
    .select({ id: quizOptions.id, questionId: quizOptions.questionId })
    .from(quizOptions)
    .where(
      and(
        inArray(quizOptions.questionId, questionIds),
        eq(quizOptions.isCorrect, true)
      )
    )
    .orderBy(quizOptions.id)
    .all();
  const key = new Map<number, number>();
  for (const row of rows) {
    if (!key.has(row.questionId)) key.set(row.questionId, row.id);
  }
  return key;
}

function markQuestions(
  db: Db,
  quizId: number,
  selected: SelectedAnswers
): QuestionResult[] {
  const questions = db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))
    .orderBy(quizQuestions.position)
    .all();
  const answerKey = getAnswerKey(
    db,
    questions.map((question) => question.id)
  );

  return questions.map((question) => {
    const selectedOptionId = selected[question.id] ?? null;
    const correctOptionId =
      selectedOptionId !== null && GRADED_TYPES.includes(question.questionType)
        ? (answerKey.get(question.id) ?? null)
        : null;
    return {
      questionId: question.id,
      correct:
        selectedOptionId !== null && selectedOptionId === correctOptionId,
      selectedOptionId,
      correctOptionId,
    };
  });
}

type Attempt = { userId: number; quizId: number; score: number; at: Date };

function recordAttempt(db: Db, attempt: Attempt, results: QuestionResult[]) {
  return db.transaction((tx) => {
    const row = tx
      .insert(quizAttempts)
      .values({
        userId: attempt.userId,
        quizId: attempt.quizId,
        score: attempt.score,
        passed: attempt.score > PASS_ABOVE,
        attemptedAt: attempt.at.toISOString(),
      })
      .returning()
      .get();
    for (const result of results) {
      if (result.selectedOptionId === null) continue;
      tx.insert(quizAnswers)
        .values({
          attemptId: row.id,
          questionId: result.questionId,
          selectedOptionId: result.selectedOptionId,
        })
        .run();
    }
    return row;
  });
}

/** Marks the Student's answers and records the attempt. */
export function gradeQuiz(
  db: Db,
  submission: { userId: number; quizId: number; selected: SelectedAnswers },
  now: Date
): QuizResult {
  const questionResults = markQuestions(
    db,
    submission.quizId,
    submission.selected
  );
  const totalQuestions = questionResults.length;
  const totalCorrect = questionResults.filter(
    (result) => result.correct
  ).length;
  const score = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;
  const attempt = recordAttempt(
    db,
    { userId: submission.userId, quizId: submission.quizId, score, at: now },
    questionResults
  );

  return {
    attemptId: attempt.id,
    score,
    passed: attempt.passed,
    grade: calculateGrade(score),
    totalCorrect,
    totalQuestions,
    questionResults,
  };
}
