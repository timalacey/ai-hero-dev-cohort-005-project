import { createTestDb, seedBaseData, type TestDb } from "~/test/setup";
import * as schema from "~/db/schema";
import {
  createComment,
  deleteComment,
  editComment,
} from "~/lib/comments.server";
import { fakeNotifications } from "~/lib/notifications.fake.server";

const START = new Date("2026-10-06T12:00:00.000Z");

/** A lesson, a Student, the course's Instructor and a platform Admin, with helpers that post through the comments service. */
export function seedLesson() {
  const db = createTestDb();
  const base = seedBaseData(db);
  const admin = db
    .insert(schema.users)
    .values({
      name: "Ada Admin",
      email: "admin@example.com",
      role: schema.UserRole.Admin,
    })
    .returning()
    .get();
  const mod = db
    .insert(schema.modules)
    .values({ courseId: base.course.id, title: "Basics", position: 1 })
    .returning()
    .get();
  const lessonId = db
    .insert(schema.lessons)
    .values({ moduleId: mod.id, title: "Lesson 1", position: 1 })
    .returning()
    .get().id;

  return {
    db,
    lessonId,
    student: base.user,
    instructor: base.instructor,
    admin,
    ...commentHelpers(db, lessonId),
  };
}

function commentHelpers(db: TestDb, lessonId: number) {
  const notifications = fakeNotifications();
  let minute = 0;
  const nextMinute = () => new Date(START.getTime() + ++minute * 60_000);

  async function post(
    authorId: number,
    body: string,
    parentId: number | null = null
  ) {
    const result = await createComment(
      db,
      authorId,
      lessonId,
      parentId,
      body,
      nextMinute(),
      notifications
    );
    if (!result.ok) throw new Error(result.error);
    return result.comment.id;
  }

  async function remove(commentId: number, userId: number) {
    const result = await deleteComment(
      db,
      commentId,
      userId,
      false,
      nextMinute(),
      notifications
    );
    if (!result.ok) throw new Error(result.error);
  }

  function edit(commentId: number, userId: number, body: string) {
    const at = nextMinute();
    const result = editComment(db, commentId, userId, body, at);
    if (!result.ok) throw new Error(result.error);
    return at.toISOString();
  }

  return { post, remove, edit };
}
