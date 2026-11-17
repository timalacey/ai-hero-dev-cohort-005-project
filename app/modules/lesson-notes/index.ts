import { describeDraft, type NoteDraft } from "./lib/draft";

export type { NoteDraft };

/**
 * What the lesson page's note editor shows about the text being typed: the
 * character count against the limit, and whether Save would do anything.
 * `savedBody` is the note as last saved (stored trimmed), or "" when there
 * is none.
 */
export function describeNoteDraft(draft: string, savedBody: string): NoteDraft {
  return describeDraft(draft, savedBody);
}
