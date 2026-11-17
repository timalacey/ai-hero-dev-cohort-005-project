import { db } from "~/db";
import {
  calculateWatchProgress,
  getLastWatchPosition,
  getLessonProgress,
  getLessonProgressForCourse,
  markLessonComplete,
  markLessonInProgress,
  recordWatchEvent,
  type Db,
  type LessonKey,
  type WatchEvent,
} from "./lib/progress";

export type { LessonKey, WatchEvent };

/**
 * A Student's progress through lessons: whether each lesson is in progress
 * or completed, and how far through its video they have watched. The app
 * uses `lessonProgressStore`; tests build their own against a test database.
 */
export function createLessonProgress(database: Db) {
  return {
    get: (key: LessonKey) => getLessonProgress(database, key),
    /** Every progress row the Student has in one course. */
    forCourse: (userId: number, courseId: number) =>
      getLessonProgressForCourse(database, userId, courseId),
    /** Opening a lesson starts it; it never moves a completed lesson back. */
    markInProgress: (key: LessonKey) => markLessonInProgress(database, key),
    markComplete: (key: LessonKey, now: Date) =>
      markLessonComplete(database, key, now),
    /** Where to resume the video, in seconds; 0 when never watched. */
    lastWatchPosition: (key: LessonKey) => getLastWatchPosition(database, key),
    watchPercent: (key: LessonKey, videoDurationSeconds: number) =>
      calculateWatchProgress(database, key, videoDurationSeconds),
    recordWatch: (key: LessonKey, event: WatchEvent, at: Date) =>
      recordWatchEvent(database, key, { ...event, at }),
  };
}

// Pure so a route importing this only for its loader doesn't pull the
// database into the client bundle (see `~/db`).
export const lessonProgressStore = /* @__PURE__ */ createLessonProgress(db);
