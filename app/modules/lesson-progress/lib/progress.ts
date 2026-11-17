import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import * as schema from "~/db/schema";
import {
  lessonProgress,
  lessons,
  LessonProgressStatus,
  modules,
  videoWatchEvents,
} from "~/db/schema";

export type Db = BetterSQLite3Database<typeof schema>;

/** One Student on one lesson. */
export type LessonKey = { userId: number; lessonId: number };

function sameLesson(key: LessonKey) {
  return and(
    eq(lessonProgress.userId, key.userId),
    eq(lessonProgress.lessonId, key.lessonId)
  );
}

export function getLessonProgress(db: Db, key: LessonKey) {
  return db.select().from(lessonProgress).where(sameLesson(key)).get();
}

export function getLessonProgressForCourse(
  db: Db,
  userId: number,
  courseId: number
) {
  const courseLessons = db
    .select({ id: lessons.id })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .where(eq(modules.courseId, courseId));

  return db
    .select()
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, userId),
        inArray(lessonProgress.lessonId, courseLessons)
      )
    )
    .all();
}

export function markLessonComplete(db: Db, key: LessonKey, now: Date) {
  const existing = getLessonProgress(db, key);
  const completed = {
    status: LessonProgressStatus.Completed,
    completedAt: now.toISOString(),
  };

  if (existing) {
    return db
      .update(lessonProgress)
      .set(completed)
      .where(eq(lessonProgress.id, existing.id))
      .returning()
      .get();
  }

  return db
    .insert(lessonProgress)
    .values({ ...key, ...completed })
    .returning()
    .get();
}

export function markLessonInProgress(db: Db, key: LessonKey) {
  const existing = getLessonProgress(db, key);

  if (existing) {
    if (existing.status === LessonProgressStatus.Completed) return existing;
    return db
      .update(lessonProgress)
      .set({ status: LessonProgressStatus.InProgress })
      .where(eq(lessonProgress.id, existing.id))
      .returning()
      .get();
  }

  return db
    .insert(lessonProgress)
    .values({ ...key, status: LessonProgressStatus.InProgress })
    .returning()
    .get();
}

function sameVideo(key: LessonKey) {
  return and(
    eq(videoWatchEvents.userId, key.userId),
    eq(videoWatchEvents.lessonId, key.lessonId)
  );
}

export function getLastWatchPosition(db: Db, key: LessonKey) {
  const lastEvent = db
    .select()
    .from(videoWatchEvents)
    .where(sameVideo(key))
    .orderBy(desc(videoWatchEvents.createdAt))
    .limit(1)
    .get();

  return lastEvent?.positionSeconds ?? 0;
}

/** The furthest point watched, as a whole percentage of the video, capped at 100. */
export function calculateWatchProgress(
  db: Db,
  key: LessonKey,
  videoDurationSeconds: number
) {
  if (videoDurationSeconds <= 0) return 0;

  const result = db
    .select({ maxPos: sql<number>`max(${videoWatchEvents.positionSeconds})` })
    .from(videoWatchEvents)
    .where(sameVideo(key))
    .get();

  const maxPosition = result?.maxPos ?? 0;
  return Math.min(Math.round((maxPosition / videoDurationSeconds) * 100), 100);
}

export type WatchEvent = { eventType: string; positionSeconds: number };

export function recordWatchEvent(
  db: Db,
  key: LessonKey,
  event: WatchEvent & { at: Date }
) {
  db.insert(videoWatchEvents)
    .values({
      ...key,
      eventType: event.eventType,
      positionSeconds: event.positionSeconds,
      createdAt: event.at.toISOString(),
    })
    .run();
}
