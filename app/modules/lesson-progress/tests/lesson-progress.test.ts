import { beforeEach, describe, expect, it } from "vitest";
import { LessonProgressStatus } from "~/db/schema";
import { createLessonProgress } from "../index.server";
import { seedTwoCourses } from "./fixtures";

const NOW = new Date("2026-10-06T12:00:00.000Z");

let seeded: ReturnType<typeof seedTwoCourses>;
let progress: ReturnType<typeof createLessonProgress>;
let key: { userId: number; lessonId: number };

beforeEach(() => {
  seeded = seedTwoCourses();
  progress = createLessonProgress(seeded.db);
  key = { userId: seeded.userId, lessonId: seeded.lessonIds[0] };
});

describe("lesson status", () => {
  it("has no progress for a lesson never opened", () => {
    expect(progress.get(key)).toBeUndefined();
  });

  it("starts a lesson when it is opened", () => {
    progress.markInProgress(key);
    expect(progress.get(key)).toMatchObject({
      status: LessonProgressStatus.InProgress,
      completedAt: null,
    });
  });

  it("completes a lesson never opened", () => {
    progress.markComplete(key, NOW);
    expect(progress.get(key)).toMatchObject({
      status: LessonProgressStatus.Completed,
      completedAt: NOW.toISOString(),
    });
  });

  it("completes a lesson in progress without adding a second row", () => {
    progress.markInProgress(key);
    progress.markComplete(key, NOW);
    expect(progress.get(key)?.status).toBe(LessonProgressStatus.Completed);
    expect(progress.forCourse(seeded.userId, seeded.courseId)).toHaveLength(1);
  });

  it("does not move a completed lesson back to in progress", () => {
    progress.markComplete(key, NOW);
    const reopened = progress.markInProgress(key);
    expect(reopened.status).toBe(LessonProgressStatus.Completed);
    expect(progress.get(key)?.completedAt).toBe(NOW.toISOString());
  });

  it("keeps the status of one lesson apart from another", () => {
    progress.markComplete(key, NOW);
    expect(
      progress.get({ ...key, lessonId: seeded.lessonIds[1] })
    ).toBeUndefined();
  });
});

describe("progress for a course", () => {
  it("lists only the Student's lessons in that course", () => {
    progress.markComplete(key, NOW);
    progress.markInProgress({ ...key, lessonId: seeded.lessonIds[1] });
    progress.markInProgress({ ...key, lessonId: seeded.otherLessonId });

    const rows = progress.forCourse(seeded.userId, seeded.courseId);
    expect(rows.map((row) => row.lessonId).sort()).toEqual(
      [...seeded.lessonIds].sort()
    );
  });

  it("does not list another Student's progress", () => {
    progress.markComplete(key, NOW);
    expect(progress.forCourse(seeded.userId + 999, seeded.courseId)).toEqual(
      []
    );
  });
});

describe("watching the video", () => {
  const at = (minutes: number) => new Date(NOW.getTime() + minutes * 60_000);

  it("resumes from 0 when the video was never watched", () => {
    expect(progress.lastWatchPosition(key)).toBe(0);
    expect(progress.watchPercent(key, 600)).toBe(0);
  });

  it("resumes from the most recent position, not the furthest", () => {
    progress.recordWatch(
      key,
      { eventType: "pause", positionSeconds: 300 },
      at(1)
    );
    progress.recordWatch(
      key,
      { eventType: "pause", positionSeconds: 120 },
      at(2)
    );
    expect(progress.lastWatchPosition(key)).toBe(120);
  });

  it("measures progress by the furthest position watched", () => {
    progress.recordWatch(
      key,
      { eventType: "pause", positionSeconds: 300 },
      at(1)
    );
    progress.recordWatch(
      key,
      { eventType: "pause", positionSeconds: 120 },
      at(2)
    );
    expect(progress.watchPercent(key, 600)).toBe(50);
  });

  it("rounds the percentage and caps it at 100", () => {
    progress.recordWatch(
      key,
      { eventType: "pause", positionSeconds: 200 },
      at(1)
    );
    expect(progress.watchPercent(key, 600)).toBe(33);
    progress.recordWatch(
      key,
      { eventType: "ended", positionSeconds: 900 },
      at(2)
    );
    expect(progress.watchPercent(key, 600)).toBe(100);
  });

  it("reports 0 for a video with no duration", () => {
    progress.recordWatch(
      key,
      { eventType: "pause", positionSeconds: 200 },
      at(1)
    );
    expect(progress.watchPercent(key, 0)).toBe(0);
  });

  it("keeps one Student's watching apart from another lesson's", () => {
    progress.recordWatch(
      key,
      { eventType: "pause", positionSeconds: 200 },
      at(1)
    );
    const other = { ...key, lessonId: seeded.lessonIds[1] };
    expect(progress.lastWatchPosition(other)).toBe(0);
    expect(progress.watchPercent(other, 600)).toBe(0);
  });
});
