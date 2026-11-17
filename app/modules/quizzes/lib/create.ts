import {
  quizOptions,
  quizQuestions,
  quizzes,
  type QuestionType,
} from "~/db/schema";
import type { Db } from "./db";

export type NewQuiz = {
  title: string;
  passingScore: number;
  questions: Array<{
    questionText: string;
    questionType: QuestionType;
    options: Array<{ optionText: string; isCorrect: boolean }>;
  }>;
};

/** Adds a quiz to a lesson; questions keep the order they are given in. */
export function createQuiz(db: Db, lessonId: number, quiz: NewQuiz) {
  return db.transaction((tx) => {
    const row = tx
      .insert(quizzes)
      .values({ lessonId, title: quiz.title, passingScore: quiz.passingScore })
      .returning()
      .get();
    const questions = quiz.questions.map((question, index) => {
      const questionRow = tx
        .insert(quizQuestions)
        .values({
          quizId: row.id,
          questionText: question.questionText,
          questionType: question.questionType,
          position: index + 1,
        })
        .returning()
        .get();
      const options = tx
        .insert(quizOptions)
        .values(
          question.options.map((option) => ({
            questionId: questionRow.id,
            ...option,
          }))
        )
        .returning()
        .all();
      return {
        id: questionRow.id,
        optionIds: options.map((option) => option.id),
      };
    });
    return { id: row.id, questions };
  });
}
