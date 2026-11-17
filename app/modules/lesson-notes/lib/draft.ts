export type NoteDraftStatus = {
  length: number;
  max: number;
  tooLong: boolean;
  empty: boolean;
  /** The draft differs from what is saved. Compared trimmed, as the server trims on save. */
  dirty: boolean;
  canSave: boolean;
};

export function noteDraftStatus(
  draft: string,
  saved: string,
  max: number
): NoteDraftStatus {
  const tooLong = draft.length > max;
  const empty = draft.trim().length === 0;
  const dirty = draft.trim() !== saved.trim();
  return {
    length: draft.length,
    max,
    tooLong,
    empty,
    dirty,
    canSave: dirty && !empty && !tooLong,
  };
}
