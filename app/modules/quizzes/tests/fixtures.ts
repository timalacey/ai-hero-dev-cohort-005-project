import { createTestDb, seedBaseData } from "~/test/setup";
import * as schema from "~/db/schema";
import { QuestionType } from "~/db/schema";
import { createQuizzes, type NewQuiz } from "../index.server";

const THREE_QUESTIONS: NewQuiz = {
  title: "Check yourself",
  passingScore: 0.7,
  questions: [
    {
      questionText: "Is TypeScript a superset of JavaScript?",
      questionType: QuestionType.TrueFalse,
      options: [
        { optionText: "True", isCorrect: true },
        { optionText: "False", isCorrect: false },
      ],
    },
    {
      questionText: "Which keyword declares a type alias?",
      questionType: QuestionType.MultipleChoice,
      options: [
        { optionText: "interface", isCorrect: false },
        { optionText: "type", isCorrect: true },
        { optionText: "alias", isCorrect: false },
      ],
    },
    {
      questionText: "Which is a primitive?",
      questionType: QuestionType.MultipleChoice,
      options: [
        { optionText: "string", isCorrect: true },
        { optionText: "Array", isCorrect: false },
      ],
    },
  ],
};

/** A lesson with a three-question quiz, and a second lesson without one. */
export function seedQuiz() {
  const db = createTestDb();
  const base = seedBaseData(db);
  const mod = db
    .insert(schema.modules)
    .values({ courseId: base.course.id, title: "Basics", position: 1 })
    .returning()
    .get();
  const [lessonId, bareLessonId] = [1, 2].map(
    (position) =>
      db
        .insert(schema.lessons)
        .values({ moduleId: mod.id, title: `Lesson ${position}`, position })
        .returning()
        .get().id
  );

  const quizzes = createQuizzes(db);
  const quiz = quizzes.create(lessonId, THREE_QUESTIONS);

  const [q1, q2, q3] = quiz.questions;
  return {
    quizzes,
    userId: base.user.id,
    otherUserId: base.instructor.id,
    lessonId,
    bareLessonId,
    quiz,
    right: {
      [q1.id]: q1.optionIds[0],
      [q2.id]: q2.optionIds[1],
      [q3.id]: q3.optionIds[0],
    },
    wrong: {
      [q1.id]: q1.optionIds[1],
      [q2.id]: q2.optionIds[0],
      [q3.id]: q3.optionIds[1],
    },
  };
}
