import type { LucideIcon } from "lucide-react";
import { BookOpen, GraduationCap, Users } from "lucide-react";

export function LandingStats({
  totalCourses,
  totalCategories,
}: {
  totalCourses: number;
  totalCategories: number;
}) {
  return (
    <section className="border-y border-border bg-muted/50 py-12">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 text-left sm:grid-cols-3">
        <Stat icon={BookOpen} value={totalCourses} label="Available Courses" />
        <Stat icon={GraduationCap} value={totalCategories} label="Categories" />
        <Stat icon={Users} value="Self-paced" label="Learn on your schedule" />
      </div>
    </section>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: number | string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="size-6 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
