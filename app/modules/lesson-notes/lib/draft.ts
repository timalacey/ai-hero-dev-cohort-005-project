import { MAX_NOTE_LENGTH } from "~/lib/notes";

export type NoteDraft = {
  length: number;
  max: number;
  tooLong: boolean;
  empty: boolean;
  unsaved: boolean;
  canSave: boolean;
};

export function describeDraft(draft: string, savedBody: string): NoteDraft {
  // Measured trimmed, because the server trims before checking the limit.
  const saved = draft.trim();
  const tooLong = saved.length > MAX_NOTE_LENGTH;
  const empty = saved.length === 0;
  const unsaved = saved !== savedBody;
  return {
    length: saved.length,
    max: MAX_NOTE_LENGTH,
    tooLong,
    empty,
    unsaved,
    canSave: unsaved && !empty && !tooLong,
  };
}
