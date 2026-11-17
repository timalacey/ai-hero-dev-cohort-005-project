import { db } from "~/db";
import { renderThread } from "./lib/render.server";
import {
  getLessonThread,
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
  };
}

// Pure so a route importing this only for its loader doesn't pull the
// database into the client bundle (see `~/db`).
export const lessonThread = /* @__PURE__ */ createLessonThread(db);
