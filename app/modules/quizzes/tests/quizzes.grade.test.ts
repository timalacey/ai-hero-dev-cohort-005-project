import { beforeEach, describe, expect, it } from "vitest";
import { QuestionType } from "~/db/schema";
import { letterGrade } from "../index.server";
import { seedQuiz } from "./fixtures";

const NOW = new Date("2026-10-06T12:00:00.000Z");

let seeded: ReturnType<typeof seedQuiz>;

beforeEach(() => {
  seeded = seedQuiz();
});

function grade(selected: Record<number, number>) {
  return seeded.quizzes.grade(
    { userId: seeded.userId, quizId: seeded.quiz.id, selected },
    NOW
  );
}

describe("grading a quiz", () => {
  it("passes with an A when every answer is right", () => {
    expect(grade(seeded.right)).toMatchObject({
      score: 1,
      passed: true,
      grade: "A",
      totalCorrect: 3,
      totalQuestions: 3,
    });
  });

  it("fails with an F when every answer is wrong", () => {
    expect(grade(seeded.wrong)).toMatchObject({
      score: 0,
      passed: false,
      grade: "F",
      totalCorrect: 0,
    });
  });

  it("reports each question's pick and the right answer", () => {
    const [q1, q2] = seeded.quiz.questions;
    const result = grade({
      [q1.id]: q1.optionIds[0],
      [q2.id]: q2.optionIds[2],
    });
    expect(result.questionResults).toEqual([
      {
        questionId: q1.id,
        correct: true,
        selectedOptionId: q1.optionIds[0],
        correctOptionId: q1.optionIds[0],
      },
      {
        questionId: q2.id,
        correct: false,
        selectedOptionId: q2.optionIds[2],
        correctOptionId: q2.optionIds[1],
      },
      {
        questionId: seeded.quiz.questions[2].id,
        correct: false,
        selectedOptionId: null,
        correctOptionId: null,
      },
    ]);
  });

  it("fails with two answers out of three right", () => {
    const [q1, q2] = seeded.quiz.questions;
    const result = grade({
      [q1.id]: q1.optionIds[0],
      [q2.id]: q2.optionIds[1],
    });
    expect(result.score).toBeCloseTo(2 / 3);
    expect(result.passed).toBe(false);
    expect(result.grade).toBe("D");
  });

  it("needs a score above 70% to pass, not 70% itself", () => {
    const tenQuestions = Array.from({ length: 10 }, (_, index) => ({
      questionText: `Question ${index + 1}`,
      questionType: QuestionType.TrueFalse,
      options: [
        { optionText: "True", isCorrect: true },
        { optionText: "False", isCorrect: false },
      ],
    }));
    const quiz = seeded.quizzes.create(seeded.bareLessonId, {
      title: "Ten",
      passingScore: 0.7,
      questions: tenQuestions,
    });
    const pick = (rightCount: number) =>
      Object.fromEntries(
        quiz.questions.map((question, index) => [
          question.id,
          question.optionIds[index < rightCount ? 0 : 1],
        ])
      );
    const submit = (rightCount: number) =>
      seeded.quizzes.grade(
        { userId: seeded.userId, quizId: quiz.id, selected: pick(rightCount) },
        NOW
      );

    expect(submit(7)).toMatchObject({ score: 0.7, passed: false, grade: "C" });
    expect(submit(8)).toMatchObject({ score: 0.8, passed: true });
  });

  it("records the options picked, skipping unanswered questions", () => {
    const [q1, q2] = seeded.quiz.questions;
    const selected = { [q1.id]: q1.optionIds[1], [q2.id]: q2.optionIds[2] };
    const result = grade(selected);
    expect(seeded.quizzes.attemptAnswers(result.attemptId)).toEqual(selected);
  });

  it("scores a quiz with no questions as 0, not a pass", () => {
    const empty = seeded.quizzes.create(seeded.bareLessonId, {
      title: "Empty",
      passingScore: 0.7,
      questions: [],
    });
    const result = seeded.quizzes.grade(
      { userId: seeded.userId, quizId: empty.id, selected: {} },
      NOW
    );
    expect(result).toMatchObject({
      score: 0,
      passed: false,
      totalQuestions: 0,
      questionResults: [],
    });
  });

  it("takes the first correct option when a question has several", () => {
    const quiz = seeded.quizzes.create(seeded.bareLessonId, {
      title: "Two right",
      passingScore: 0.7,
      questions: [
        {
          questionText: "Pick a truthy value",
          questionType: QuestionType.MultipleChoice,
          options: [
            { optionText: "1", isCorrect: true },
            { optionText: "'a'", isCorrect: true },
            { optionText: "0", isCorrect: false },
          ],
        },
      ],
    });
    const [question] = quiz.questions;
    const result = seeded.quizzes.grade(
      {
        userId: seeded.userId,
        quizId: quiz.id,
        selected: { [question.id]: question.optionIds[1] },
      },
      NOW
    );
    expect(result.questionResults[0]).toMatchObject({
      correct: false,
      correctOptionId: question.optionIds[0],
    });
  });

  it("records each attempt with its own id", () => {
    const first = grade(seeded.right);
    const second = grade(seeded.wrong);
    expect(second.attemptId).not.toBe(first.attemptId);
  });
});

describe("letter grades", () => {
  it.each([
    [1, "A"],
    [0.9, "A"],
    [0.89, "B"],
    [0.8, "B"],
    [0.79, "C"],
    [0.7, "C"],
    [0.69, "D"],
    [0.6, "D"],
    [0.59, "F"],
  ])("gives %s a %s", (score, letter) => {
    expect(letterGrade(score)).toBe(letter);
  });
});
