import { readDraft, type NoteDraft } from "./lib/draft";

export type { NoteDraft };

/**
 * What the note editor should show for the text in the box, given the note
 * already saved for the lesson (`null` when there is none yet).
 */
export function describeNoteDraft(
  draft: string,
  savedBody: string | null
): NoteDraft {
  return readDraft(draft, savedBody);
}
