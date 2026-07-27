import { describe, expect, it } from "vitest";
import { transposeDocument } from "../transpose";
import { doc, lyric } from "./helpers";

describe("transposeDocument", () => {
  it("transposes every chord's root while preserving suffixes", () => {
    const original = doc("[C]Twinkle [G]twinkle\n[Am7]little [Fmaj7]star");
    const transposed = transposeDocument(original, 2);
    expect(lyric(transposed, 0).chords.map((c) => c.name)).toEqual(["D", "A"]);
    expect(lyric(transposed, 1).chords.map((c) => c.name)).toEqual([
      "Bm7",
      "Gmaj7",
    ]);
  });

  it("is a no-op for zero semitones, returning the same document", () => {
    const original = doc("[C]Hello");
    expect(transposeDocument(original, 0)).toBe(original);
  });

  it("leaves non-lyric lines untouched", () => {
    const original = doc("{comment: note}\n[C]Hello");
    const transposed = transposeDocument(original, 1);
    expect(transposed.lines[0]).toBe(original.lines[0]);
  });
});
