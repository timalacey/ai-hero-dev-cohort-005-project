import type { loadLessonPage } from "./lib/load.server";

/** What the lesson page loader returns: a locked or a full lesson view. */
export type LessonPageData = Awaited<ReturnType<typeof loadLessonPage>>;
