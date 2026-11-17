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
  const tooLong = draft.length > MAX_NOTE_LENGTH;
  const empty = draft.trim().length === 0;
  const unsaved = draft.trim() !== savedBody;
  return {
    length: draft.length,
    max: MAX_NOTE_LENGTH,
    tooLong,
    empty,
    unsaved,
    canSave: unsaved && !empty && !tooLong,
  };
}
