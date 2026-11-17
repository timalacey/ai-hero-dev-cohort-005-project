import { MAX_NOTE_LENGTH } from "~/lib/notes";
import { noteDraftStatus, type NoteDraftStatus } from "./lib/draft";

export type { NoteDraftStatus };

/**
 * What the note editor should show for the text in the box, given the note
 * as last saved (empty string when there is none). Mirrors the server's
 * save-note rules so the Save button is only enabled when a save would land.
 */
export function describeNoteDraft(
  draft: string,
  saved: string,
  max: number = MAX_NOTE_LENGTH
): NoteDraftStatus {
  return noteDraftStatus(draft, saved, max);
}
