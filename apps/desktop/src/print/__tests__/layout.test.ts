import { describe, expect, it } from "vitest";
import { layoutChordRow, rowCount } from "../layout";

const CW = 6; // one character, in points
const WIDE = 600;

/** Asserts no two names on the same row share any horizontal space. */
function expectNoOverlap(
  placed: { name: string; x: number; row: number }[],
  charWidth = CW,
) {
  const byRow = new Map<number, typeof placed>();
  for (const chord of placed) {
    const row = byRow.get(chord.row) ?? [];
    row.push(chord);
    byRow.set(chord.row, row);
  }
  for (const row of byRow.values()) {
    const sorted = [...row].sort((a, b) => a.x - b.x);
    for (let i = 1; i < sorted.length; i++) {
      const previousEnd =
        sorted[i - 1].x + sorted[i - 1].name.length * charWidth;
      expect(sorted[i].x).toBeGreaterThanOrEqual(previousEnd);
    }
  }
}

describe("layoutChordRow — anchored over lyrics", () => {
  it("puts each chord over its own column", () => {
    const placed = layoutChordRow(
      [
        { name: "C", position: 0 },
        { name: "G", position: 10 },
        { name: "Am", position: 20 },
      ],
      { charWidth: CW, usableWidth: WIDE, anchored: true },
    );
    expect(placed.map((c) => c.x)).toEqual([0, 60, 120]);
    expect(rowCount(placed)).toBe(1);
  });

  it("nudges a chord right rather than letting two names collide", () => {
    // "Cmaj7" is 5 chars wide but the next chord is only 2 columns along, so
    // anchoring both exactly would overlap them into mush on paper.
    const placed = layoutChordRow(
      [
        { name: "Cmaj7", position: 0 },
        { name: "Am7", position: 2 },
      ],
      { charWidth: CW, usableWidth: WIDE, anchored: true },
    );
    expect(placed[0].x).toBe(0);
    expect(placed[1].x).toBeGreaterThanOrEqual(5 * CW);
    expectNoOverlap(placed);
  });

  it("keeps later chords aligned when there's no collision to resolve", () => {
    const placed = layoutChordRow(
      [
        { name: "C", position: 0 },
        { name: "G", position: 30 },
      ],
      { charWidth: CW, usableWidth: WIDE, anchored: true },
    );
    expect(placed[1].x).toBe(180);
  });
});

describe("layoutChordRow — an instrumental bar with no lyrics", () => {
  it("flows chords left to right instead of stacking them", () => {
    // This is the interlude case: every chord parked at column 0.
    const placed = layoutChordRow(
      [
        { name: "Em7", position: 0 },
        { name: "Am7", position: 0 },
        { name: "G", position: 0 },
        { name: "F", position: 0 },
      ],
      { charWidth: CW, usableWidth: WIDE, anchored: false },
    );
    expect(new Set(placed.map((c) => c.x)).size).toBe(4);
    expect(placed.map((c) => c.x)).toEqual([0, 30, 60, 78]);
    expectNoOverlap(placed);
  });

  it("separates chords that sit only a column apart", () => {
    const placed = layoutChordRow(
      [
        { name: "Em7", position: 0 },
        { name: "Am7", position: 1 },
      ],
      { charWidth: CW, usableWidth: WIDE, anchored: false },
    );
    expectNoOverlap(placed);
  });

  it("wraps onto another row rather than running off the page", () => {
    const many = Array.from({ length: 40 }, () => ({
      name: "Am7",
      position: 0,
    }));
    const placed = layoutChordRow(many, {
      charWidth: CW,
      usableWidth: 120,
      anchored: false,
    });
    expect(rowCount(placed)).toBeGreaterThan(1);
    expectNoOverlap(placed);
    for (const chord of placed) {
      expect(chord.x + chord.name.length * CW).toBeLessThanOrEqual(120);
    }
  });

  it("handles a single chord and an empty line", () => {
    expect(
      layoutChordRow([{ name: "C", position: 0 }], {
        charWidth: CW,
        usableWidth: WIDE,
        anchored: false,
      }),
    ).toEqual([{ name: "C", x: 0, row: 0 }]);
    expect(
      layoutChordRow([], { charWidth: CW, usableWidth: WIDE, anchored: false }),
    ).toEqual([]);
    expect(rowCount([])).toBe(0);
  });
});
