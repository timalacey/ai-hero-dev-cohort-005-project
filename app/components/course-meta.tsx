import { BookOpen, User } from "lucide-react";

export function CourseMeta({
  instructorName,
  lessonCount,
}: {
  instructorName: string | null;
  lessonCount: number;
}) {
  return (
    <>
      <span className="flex items-center gap-1">
        <User className="size-3" />
        {instructorName ?? "Instructor"}
      </span>
      <span className="flex items-center gap-1">
        <BookOpen className="size-3" />
        {lessonCount} lessons
      </span>
    </>
  );
}
