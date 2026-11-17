import { beforeEach, describe, expect, it } from "vitest";
import { createLessonThread } from "../index.server";
import { seedLesson } from "./fixtures";

let seeded: ReturnType<typeof seedLesson>;
let thread: ReturnType<typeof createLessonThread>;

beforeEach(() => {
  seeded = seedLesson();
  thread = createLessonThread(seeded.db);
});

describe("a lesson's thread", () => {
  it("is empty for a lesson nobody has asked about", () => {
    expect(thread.get(seeded.lessonId)).toEqual([]);
  });

  it("is empty for a lesson that does not exist", () => {
    expect(thread.get(seeded.lessonId + 999)).toEqual([]);
  });

  it("lists questions oldest first, with replies under the question they answer", async () => {
    const first = await seeded.post(seeded.student.id, "First question");
    const second = await seeded.post(seeded.student.id, "Second question");
    const reply = await seeded.post(seeded.instructor.id, "An answer", first);

    const result = thread.get(seeded.lessonId);
    expect(result.map((comment) => comment.id)).toEqual([first, second]);
    expect(result[0].replies.map((comment) => comment.id)).toEqual([reply]);
    expect(result[1].replies).toEqual([]);
    expect(result[0]).toMatchObject({
      body: "First question",
      deleted: false,
      editedAt: null,
    });
  });

  it("marks who is the course's Instructor and who is a platform Admin", async () => {
    await seeded.post(seeded.student.id, "From a student");
    await seeded.post(seeded.instructor.id, "From the instructor");
    await seeded.post(seeded.admin.id, "From an admin");

    const authors = thread
      .get(seeded.lessonId)
      .map((comment) => comment.author);
    expect(authors).toEqual([
      {
        id: seeded.student.id,
        name: "Test User",
        avatarUrl: null,
        isInstructor: false,
        isPlatformAdmin: false,
      },
      {
        id: seeded.instructor.id,
        name: "Test Instructor",
        avatarUrl: null,
        isInstructor: true,
        isPlatformAdmin: false,
      },
      {
        id: seeded.admin.id,
        name: "Ada Admin",
        avatarUrl: null,
        isInstructor: false,
        isPlatformAdmin: true,
      },
    ]);
  });

  it("shows when a comment was edited", async () => {
    const id = await seeded.post(seeded.student.id, "Typo");
    const editedAt = seeded.edit(id, seeded.student.id, "Fixed");
    expect(thread.get(seeded.lessonId)[0]).toMatchObject({
      body: "Fixed",
      editedAt,
    });
  });
});

describe("deleted comments", () => {
  it("keeps a deleted question that has replies, without its body", async () => {
    const question = await seeded.post(seeded.student.id, "Secret");
    seeded.edit(question, seeded.student.id, "Secret, edited");
    await seeded.post(seeded.instructor.id, "Answer", question);
    await seeded.remove(question, seeded.student.id);

    const [kept] = thread.get(seeded.lessonId);
    expect(kept).toMatchObject({
      id: question,
      deleted: true,
      body: "",
      editedAt: null,
    });
    expect(kept.replies).toHaveLength(1);
  });

  it("drops a deleted question with no replies", async () => {
    const question = await seeded.post(seeded.student.id, "Never mind");
    await seeded.remove(question, seeded.student.id);
    expect(thread.get(seeded.lessonId)).toEqual([]);
  });

  it("drops a deleted reply", async () => {
    const question = await seeded.post(seeded.student.id, "Question");
    const reply = await seeded.post(
      seeded.instructor.id,
      "Wrong answer",
      question
    );
    await seeded.remove(reply, seeded.instructor.id);
    expect(thread.get(seeded.lessonId)[0].replies).toEqual([]);
  });
});

describe("the rendered thread", () => {
  it("renders bodies to sanitised HTML, replies included", async () => {
    const question = await seeded.post(
      seeded.student.id,
      "Why **this**? <script>alert(1)</script>"
    );
    await seeded.post(seeded.instructor.id, "Because `that`", question);

    const [rendered] = await thread.rendered(seeded.lessonId);
    expect(rendered.bodyHtml).toContain("<strong>this</strong>");
    expect(rendered.bodyHtml).not.toContain("<script>");
    expect(rendered.replies[0].bodyHtml).toContain("<code>that</code>");
  });

  it("renders nothing for a deleted question", async () => {
    const question = await seeded.post(seeded.student.id, "Gone");
    await seeded.post(seeded.instructor.id, "Still here", question);
    await seeded.remove(question, seeded.student.id);

    const [rendered] = await thread.rendered(seeded.lessonId);
    expect(rendered.bodyHtml).toBe("");
  });
});

describe("whether a comment is on a lesson", () => {
  it("is true for a comment posted on the lesson", async () => {
    const id = await seeded.post(seeded.student.id, "A question");
    expect(thread.has(seeded.lessonId, id)).toBe(true);
  });

  it("is false for the same comment asked about from another lesson", async () => {
    const id = await seeded.post(seeded.student.id, "A question");
    expect(thread.has(seeded.lessonId + 1, id)).toBe(false);
  });

  it("is false for a comment that does not exist", () => {
    expect(thread.has(seeded.lessonId, 999)).toBe(false);
  });
});
