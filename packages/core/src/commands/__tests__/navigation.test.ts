import { describe, expect, it } from "vitest";
import { adjacentLyricLine } from "../navigation";
import { doc } from "./helpers";

describe("adjacentLyricLine", () => {
  it("finds the immediately adjacent lyric line", () => {
    const original = doc("one\ntwo\nthree");
    const first = original.lines[0];
    const second = original.lines[1];
    const third = original.lines[2];
    expect(adjacentLyricLine(original, second.id, 1)?.id).toBe(third.id);
    expect(adjacentLyricLine(original, second.id, -1)?.id).toBe(first.id);
  });

  it("skips over non-lyric lines", () => {
    const original = doc("one\n{comment: note}\ntwo");
    const first = original.lines[0];
    const third = original.lines[2];
    expect(adjacentLyricLine(original, first.id, 1)?.id).toBe(third.id);
    expect(adjacentLyricLine(original, third.id, -1)?.id).toBe(first.id);
  });

  it("returns null at the start/end of the document", () => {
    const original = doc("only line");
    const only = original.lines[0];
    expect(adjacentLyricLine(original, only.id, 1)).toBeNull();
    expect(adjacentLyricLine(original, only.id, -1)).toBeNull();
  });
});
