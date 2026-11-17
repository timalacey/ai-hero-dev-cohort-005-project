import { createTestDb, seedBaseData } from "~/test/setup";
import * as schema from "~/db/schema";
import { markdown } from "~/lib/text";

/** A test database with two courses: one Student, and two lessons in the first. */
export function seedTwoCourses() {
  const db = createTestDb();
  const base = seedBaseData(db);

  const otherCourse = db
    .insert(schema.courses)
    .values({
      title: "Other Course",
      slug: "other-course",
      description: "Another course",
      salesCopy: markdown("Other"),
      instructorId: base.instructor.id,
      categoryId: base.category.id,
      status: schema.CourseStatus.Published,
    })
    .returning()
    .get();

  const addLesson = (courseId: number, position: number) => {
    const mod = db
      .insert(schema.modules)
      .values({ courseId, title: `Module ${position}`, position })
      .returning()
      .get();
    return db
      .insert(schema.lessons)
      .values({ moduleId: mod.id, title: `Lesson ${position}`, position })
      .returning()
      .get().id;
  };

  return {
    db,
    userId: base.user.id,
    courseId: base.course.id,
    lessonIds: [addLesson(base.course.id, 1), addLesson(base.course.id, 2)],
    otherLessonId: addLesson(otherCourse.id, 1),
  };
}
