import { Link } from "react-router";
import { ArrowRight, BookOpen, Sparkles, User } from "lucide-react";
import { Button } from "~/components/ui/button";
import { CourseImage } from "~/components/course-image";

export type HeroCourse = {
  id: number;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  instructorName: string | null;
  lessonCount: number;
};

export function LandingHero({
  courses,
  isSignedIn,
}: {
  courses: HeroCourse[];
  isSignedIn: boolean;
}) {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 text-left lg:grid-cols-[1.1fr_1fr] lg:py-28">
      <div>
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" />
          Self-paced courses for developers
        </p>
        <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-6xl">
          Learn to code,
          <br />
          <span className="text-muted-foreground">at your own pace</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Structured courses built by experienced instructors. Track your
          progress, take quizzes, and build real-world skills.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button asChild size="lg">
            <Link to="/courses">
              Browse Courses
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            {isSignedIn ? (
              <Link to="/dashboard">Go to your dashboard</Link>
            ) : (
              <Link to="/signup">Create a free account</Link>
            )}
          </Button>
        </div>
      </div>
      {courses.length > 0 && <CoursePreview courses={courses} />}
    </section>
  );
}

function CoursePreview({ courses }: { courses: HeroCourse[] }) {
  const [lead, ...rest] = courses;
  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent blur-2xl" />
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <Link to={`/courses/${lead.slug}`} className="group block">
          <CourseImage
            src={lead.coverImageUrl}
            alt={lead.title}
            className="aspect-video w-full object-cover"
          />
          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Start here
            </p>
            <h2 className="mt-1 text-lg font-semibold group-hover:text-primary">
              {lead.title}
            </h2>
            <CourseMeta course={lead} />
          </div>
        </Link>
        {rest.map((course) => (
          <Link
            key={course.id}
            to={`/courses/${course.slug}`}
            className="group flex items-center justify-between gap-4 border-t border-border px-5 py-3"
          >
            <span className="font-medium group-hover:text-primary">
              {course.title}
            </span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function CourseMeta({ course }: { course: HeroCourse }) {
  return (
    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <User className="size-3" />
        {course.instructorName ?? "Instructor"}
      </span>
      <span className="flex items-center gap-1">
        <BookOpen className="size-3" />
        {course.lessonCount} lessons
      </span>
    </div>
  );
}
