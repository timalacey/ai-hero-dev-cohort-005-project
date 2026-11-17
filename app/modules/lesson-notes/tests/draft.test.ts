import { describe, it, expect } from "vitest";
import { describeNoteDraft } from "../index";
import { MAX_NOTE_LENGTH } from "~/lib/notes";

describe("describeNoteDraft", () => {
  it("cannot save an empty box when there is no note yet", () => {
    expect(describeNoteDraft("", null)).toEqual({
      length: 0,
      limit: MAX_NOTE_LENGTH,
      tooLong: false,
      empty: true,
      unsaved: false,
      canSave: false,
    });
  });

  it("can save new text", () => {
    const draft = describeNoteDraft("Generics are like parameters", null);
    expect(draft.canSave).toBe(true);
    expect(draft.unsaved).toBe(true);
    expect(draft.length).toBe(28);
  });

  it("counts the characters the server will keep, without surrounding spaces", () => {
    expect(describeNoteDraft("  hi  \n", null).length).toBe(2);
  });

  it("treats whitespace-only text as empty", () => {
    const draft = describeNoteDraft("   \n ", null);
    expect(draft.empty).toBe(true);
    expect(draft.canSave).toBe(false);
  });

  it("has nothing to save when the box matches the saved note", () => {
    const draft = describeNoteDraft("saved text ", "saved text");
    expect(draft.unsaved).toBe(false);
    expect(draft.canSave).toBe(false);
  });

  it("has something to save once the saved note is edited", () => {
    const draft = describeNoteDraft("saved text, more", "saved text");
    expect(draft.unsaved).toBe(true);
    expect(draft.canSave).toBe(true);
  });

  it("allows a note exactly at the limit", () => {
    const draft = describeNoteDraft("a".repeat(MAX_NOTE_LENGTH), null);
    expect(draft.tooLong).toBe(false);
    expect(draft.canSave).toBe(true);
  });

  it("refuses a note one character over the limit", () => {
    const draft = describeNoteDraft("a".repeat(MAX_NOTE_LENGTH + 1), null);
    expect(draft.tooLong).toBe(true);
    expect(draft.canSave).toBe(false);
  });

  it("reports clearing a saved note as unsaved but not saveable", () => {
    const draft = describeNoteDraft("", "old note");
    expect(draft.unsaved).toBe(true);
    expect(draft.empty).toBe(true);
    expect(draft.canSave).toBe(false);
  });
});
