import { describe, expect, it } from "vitest";
import { describeNoteDraft } from "../index";
import { MAX_NOTE_LENGTH } from "~/lib/notes";

describe("describeNoteDraft", () => {
  it("counts characters against the note limit", () => {
    const draft = describeNoteDraft("hello", "");
    expect(draft.length).toBe(5);
    expect(draft.max).toBe(MAX_NOTE_LENGTH);
  });

  it("allows saving new text", () => {
    const draft = describeNoteDraft("hello", "");
    expect(draft).toMatchObject({
      unsaved: true,
      empty: false,
      tooLong: false,
      canSave: true,
    });
  });

  it("does not offer to save text that matches the saved note", () => {
    const draft = describeNoteDraft("hello", "hello");
    expect(draft.unsaved).toBe(false);
    expect(draft.canSave).toBe(false);
  });

  it("does not offer to save a blank note", () => {
    const draft = describeNoteDraft("   ", "hello");
    expect(draft.empty).toBe(true);
    expect(draft.unsaved).toBe(true);
    expect(draft.canSave).toBe(false);
  });

  it("accepts a note exactly at the limit", () => {
    const draft = describeNoteDraft("a".repeat(MAX_NOTE_LENGTH), "");
    expect(draft.tooLong).toBe(false);
    expect(draft.canSave).toBe(true);
  });

  it("refuses a note one character over the limit", () => {
    const draft = describeNoteDraft("a".repeat(MAX_NOTE_LENGTH + 1), "");
    expect(draft.tooLong).toBe(true);
    expect(draft.canSave).toBe(false);
  });
});

describe("describeNoteDraft whitespace", () => {
  it("treats surrounding whitespace as no change, since notes are saved trimmed", () => {
    const draft = describeNoteDraft("hello  \n", "hello");
    expect(draft.unsaved).toBe(false);
    expect(draft.canSave).toBe(false);
  });
});

describe("describeNoteDraft length", () => {
  it("does not count surrounding whitespace against the limit, since the server trims first", () => {
    const draft = describeNoteDraft(`  ${"a".repeat(MAX_NOTE_LENGTH)}\n`, "");
    expect(draft.length).toBe(MAX_NOTE_LENGTH);
    expect(draft.tooLong).toBe(false);
    expect(draft.canSave).toBe(true);
  });
});
