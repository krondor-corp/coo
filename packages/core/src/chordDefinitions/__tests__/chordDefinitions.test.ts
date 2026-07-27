import { describe, expect, it } from "vitest";
import { formatChordDefinition } from "../format";
import { parseChordDefinitions } from "../parse";

describe("parseChordDefinitions", () => {
  it("supports muted strings", () => {
    const result = parseChordDefinitions(
      "{define: C frets x 3 2 0 1 0}\n[C]Hello",
    );
    expect(result.chordDefinitions[0].frets).toEqual(["x", 3, 2, 0, 1, 0]);
    expect(result.cleaned).toContain("__CHORD_DEFS__");
  });

  it("defaults base-fret to 1 when omitted", () => {
    const result = parseChordDefinitions("{define: C frets x 3 2 0 1 0}");
    expect(result.chordDefinitions[0].baseFret).toBe(1);
  });

  it("parses an explicit base-fret and fingers", () => {
    const result = parseChordDefinitions(
      "{define: F base-fret 1 frets 1 1 2 3 3 1 fingers 1 1 2 4 3 1}",
    );
    expect(result.chordDefinitions[0].baseFret).toBe(1);
    expect(result.chordDefinitions[0].fingers).toEqual([1, 1, 2, 4, 3, 1]);
  });
});

describe("formatChordDefinition", () => {
  it("round trips through parseChordDefinitions", () => {
    const raw = "{define: C base-fret 1 frets x 3 2 0 1 0}";
    const { chordDefinitions } = parseChordDefinitions(raw);
    expect(formatChordDefinition(chordDefinitions[0])).toBe(raw);
  });

  it("omits fingers when there are none", () => {
    const formatted = formatChordDefinition({
      name: "G",
      baseFret: 1,
      frets: [3, 2, 0, 0, 3, 3],
      fingers: [],
    });
    expect(formatted).not.toContain("fingers");
  });
});
