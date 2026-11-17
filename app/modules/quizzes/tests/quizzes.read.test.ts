import { beforeEach, describe, expect, it } from "vitest";
import { seedQuiz } from "./fixtures";

const NOW = new Date("2026-10-06T12:00:00.000Z");

let seeded: ReturnType<typeof seedQuiz>;

beforeEach(() => {
  seeded = seedQuiz();
});

describe("the quiz a Student sees", () => {
  it("is null for a lesson without a quiz", () => {
    expect(seeded.quizzes.forStudent(seeded.bareLessonId)).toBeNull();
  });

  it("lists questions in order, each with only its own options", () => {
    const quiz = seeded.quizzes.forStudent(seeded.lessonId);
    expect(quiz).toMatchObject({
      id: seeded.quiz.id,
      title: "Check yourself",
      passingScore: 0.7,
    });
    expect(quiz?.questions.map((question) => question.position)).toEqual([
      1, 2, 3,
    ]);
    expect(quiz?.questions[0]).toMatchObject({
      questionText: "Is TypeScript a superset of JavaScript?",
      questionType: "true_false",
    });
    expect(
      quiz?.questions[1].options.map((option) => option.optionText)
    ).toEqual(["interface", "type", "alias"]);
  });

  it("does not reveal which option is correct", () => {
    const quiz = seeded.quizzes.forStudent(seeded.lessonId);
    for (const question of quiz?.questions ?? []) {
      for (const option of question.options) {
        expect(Object.keys(option).sort()).toEqual(["id", "optionText"]);
      }
    }
  });
});

describe("finding a quiz in a lesson", () => {
  it("finds the lesson's own quiz", () => {
    expect(
      seeded.quizzes.findInLesson(seeded.quiz.id, seeded.lessonId)?.id
    ).toBe(seeded.quiz.id);
  });

  it("does not find a quiz from another lesson", () => {
    expect(
      seeded.quizzes.findInLesson(seeded.quiz.id, seeded.bareLessonId)
    ).toBeUndefined();
  });
});

describe("the best attempt", () => {
  it("is null before the first attempt", () => {
    expect(
      seeded.quizzes.bestAttempt(seeded.userId, seeded.quiz.id)
    ).toBeNull();
  });

  it("is the highest score, not the latest", () => {
    const submit = (selected: Record<number, number>) =>
      seeded.quizzes.grade(
        { userId: seeded.userId, quizId: seeded.quiz.id, selected },
        NOW
      );
    submit(seeded.right);
    submit(seeded.wrong);
    expect(seeded.quizzes.bestAttempt(seeded.userId, seeded.quiz.id)).toEqual({
      score: 1,
      passed: true,
    });
  });

  it("belongs to the Student who made it", () => {
    seeded.quizzes.grade(
      { userId: seeded.userId, quizId: seeded.quiz.id, selected: seeded.right },
      NOW
    );
    expect(
      seeded.quizzes.bestAttempt(seeded.otherUserId, seeded.quiz.id)
    ).toBeNull();
  });
});
