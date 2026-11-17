import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTestDb, seedBaseData, type TestDb } from "~/test/setup";
import * as schema from "~/db/schema";
import { setCurrentUserId } from "~/lib/session";

// The module reads the app-wide `db`, and coursePermissions captures it at
// import, so forward every access to this test's fresh database.
const state = vi.hoisted(() => ({ db: {} as object }));
vi.mock("~/db", () => ({
  db: new Proxy(
    {},
    { get: (_target, key) => Reflect.get(state.db, key, state.db) }
  ),
}));

const { loadLessonPage, runLessonAction } = await import("../index.server");

let db: TestDb;
let base: ReturnType<typeof seedBaseData>;
let lessonId: number;

beforeEach(() => {
  db = createTestDb();
  state.db = db;
  base = seedBaseData(db);
  const mod = db
    .insert(schema.modules)
    .values({ courseId: base.course.id, title: "Basics", position: 1 })
    .returning()
    .get();
  lessonId = db
    .insert(schema.lessons)
    .values({ moduleId: mod.id, title: "Hello", position: 1 })
    .returning()
    .get().id;
});

async function requestAs(userId: number, body?: Record<string, string>) {
  const cookie = await setCurrentUserId(new Request("http://test/"), userId);
  return new Request("http://test/", {
    method: body ? "POST" : "GET",
    headers: { Cookie: cookie.split(";")[0] },
    body: body ? new URLSearchParams(body) : undefined,
  });
}

const params = () => ({ slug: "test-course", lessonId: String(lessonId) });

function enrollStudent() {
  db.insert(schema.enrollments)
    .values({ userId: base.user.id, courseId: base.course.id })
    .run();
}

describe("lesson page", () => {
  it("locks the lesson for a student who has not enrolled", async () => {
    const page = await loadLessonPage({
      params: params(),
      request: await requestAs(base.user.id),
    });
    expect(page.view).toBe("locked");
  });

  it("shows a note the student saved on the lesson", async () => {
    enrollStudent();
    const saved = await runLessonAction({
      params: params(),
      request: await requestAs(base.user.id, {
        intent: "save-note",
        body: "  remember this  ",
      }),
    });
    expect(saved).toEqual({ ok: true });

    const page = await loadLessonPage({
      params: params(),
      request: await requestAs(base.user.id),
    });
    expect(page.view === "full" && page.note?.body).toBe("remember this");
  });

  it("refuses a blank note", async () => {
    enrollStudent();
    const result = await runLessonAction({
      params: params(),
      request: await requestAs(base.user.id, {
        intent: "save-note",
        body: "   ",
      }),
    });
    expect(result).toEqual({
      ok: false,
      error: "Write something before saving your note.",
    });
  });
});
