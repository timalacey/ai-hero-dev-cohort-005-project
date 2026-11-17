import { describe, it, expect } from "vitest";
import { describeNoteDraft } from "../index";

describe("describeNoteDraft", () => {
  it("cannot save an untouched note", () => {
    const status = describeNoteDraft("my note", "my note");
    expect(status.dirty).toBe(false);
    expect(status.canSave).toBe(false);
  });

  it("treats whitespace the server trims away as unchanged", () => {
    const status = describeNoteDraft("my note\n\n", "my note");
    expect(status.dirty).toBe(false);
    expect(status.canSave).toBe(false);
  });

  it("ignores surrounding whitespace on the saved note too", () => {
    expect(describeNoteDraft("my note", "  my note\n").dirty).toBe(false);
  });

  it("can save an edited note", () => {
    const status = describeNoteDraft("my note, edited", "my note");
    expect(status).toEqual({
      length: 15,
      max: 2000,
      tooLong: false,
      empty: false,
      dirty: true,
      canSave: true,
    });
  });

  it("cannot save a blank note, matching the server's rule", () => {
    const status = describeNoteDraft("   \n ", "my note");
    expect(status.empty).toBe(true);
    expect(status.dirty).toBe(true);
    expect(status.canSave).toBe(false);
  });

  it("allows a note exactly at the limit", () => {
    const status = describeNoteDraft("a".repeat(10), "", 10);
    expect(status.tooLong).toBe(false);
    expect(status.canSave).toBe(true);
  });

  it("refuses a note one character over the limit", () => {
    const status = describeNoteDraft("a".repeat(11), "", 10);
    expect(status.tooLong).toBe(true);
    expect(status.length).toBe(11);
    expect(status.canSave).toBe(false);
  });

  it("uses the server's note limit by default", () => {
    expect(describeNoteDraft("", "").max).toBe(2000);
  });
});
