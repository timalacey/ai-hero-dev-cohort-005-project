import { db } from "~/db";
import { renderThread } from "./lib/render.server";
import {
  getLessonThread,
  isCommentOnLesson,
  type CommentAuthor,
  type Db,
  type ThreadComment,
} from "./lib/thread";

export type { CommentAuthor, ThreadComment };

/**
 * A lesson's Questions & Discussion as the page shows it: top-level questions
 * oldest first, each with its replies. The app uses `lessonThread`; tests
 * build their own against a test database.
 */
export function createLessonThread(database: Db) {
  return {
    /** The thread with Markdown bodies, before rendering. */
    get: (lessonId: number) => getLessonThread(database, lessonId),
    /** The thread with every body rendered to sanitised HTML. */
    rendered: (lessonId: number) =>
      renderThread(getLessonThread(database, lessonId)),
    /**
     * Whether the comment belongs to this lesson's thread. Check it before
     * editing or deleting, so posting another lesson's comment id to this
     * lesson's page reaches nothing.
     */
    has: (lessonId: number, commentId: number) =>
      isCommentOnLesson(database, lessonId, commentId),
  };
}

// Pure so a route importing this only for its loader doesn't pull the
// database into the client bundle (see `~/db`).
export const lessonThread = /* @__PURE__ */ createLessonThread(db);
