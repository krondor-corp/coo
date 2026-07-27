import { describe, expect, it } from "vitest";
import { transposeKey } from "../transpose";

describe("transposeKey", () => {
  it("preserves flat spelling and suffixes", () => {
    expect(transposeKey("Bb minor", 2)).toBe("C minor");
  });

  it("preserves sharp spelling", () => {
    expect(transposeKey("C#", 1)).toBe("D");
  });

  it("wraps around the octave in both directions", () => {
    expect(transposeKey("C", -1)).toBe("B");
    expect(transposeKey("B", 1)).toBe("C");
  });

  it("returns the input unchanged when it isn't a recognizable key", () => {
    expect(transposeKey("not a key", 3)).toBe("not a key");
  });
});
