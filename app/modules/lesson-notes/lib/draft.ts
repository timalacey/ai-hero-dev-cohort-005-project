import { MAX_NOTE_LENGTH } from "~/lib/notes";

export type NoteDraft = {
  /** Characters the server will store: it trims before it saves. */
  length: number;
  limit: number;
  tooLong: boolean;
  empty: boolean;
  /** The draft differs from what is saved, so leaving would lose it. */
  unsaved: boolean;
  canSave: boolean;
};

export function readDraft(draft: string, savedBody: string | null): NoteDraft {
  const trimmed = draft.trim();
  const length = trimmed.length;
  const tooLong = length > MAX_NOTE_LENGTH;
  const empty = length === 0;
  const unsaved = trimmed !== (savedBody ?? "");

  return {
    length,
    limit: MAX_NOTE_LENGTH,
    tooLong,
    empty,
    unsaved,
    canSave: unsaved && !empty && !tooLong,
  };
}
