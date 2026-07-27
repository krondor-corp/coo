import { describe, expect, it } from "vitest";
import { createIdFactory } from "../../document";
import {
  deleteChord,
  insertChordAt,
  listChords,
  moveChord,
  moveChordToBoundary,
  renameChord,
} from "../chords";
import { doc, lyric } from "./helpers";

describe("insertChordAt", () => {
  it("inserts a chord at the given grapheme position", () => {
    const makeId = createIdFactory();
    const original = doc("Hello world");
    const d = insertChordAt(original, lyric(original).id, 6, "G", makeId);
    expect(lyric(d).chords).toEqual([{ id: "id-0", name: "G", position: 6 }]);
  });

  it("clamps position to the line length", () => {
    const makeId = createIdFactory();
    const original = doc("Hi");
    const d = insertChordAt(original, lyric(original).id, 99, "C", makeId);
    expect(lyric(d).chords[0].position).toBe(2);
  });
});

describe("renameChord / deleteChord", () => {
  it("renames a chord in place", () => {
    const original = doc("[F]Hello");
    const chordId = lyric(original).chords[0].id;
    const renamed = renameChord(original, chordId, "Fmaj7");
    expect(lyric(renamed).chords[0].name).toBe("Fmaj7");
  });

  it("deletes a chord", () => {
    const original = doc("[F]Hello");
    const chordId = lyric(original).chords[0].id;
    const deleted = deleteChord(original, chordId);
    expect(lyric(deleted).chords).toHaveLength(0);
  });
});

describe("moveChord", () => {
  it("nudges by delta and clamps at both ends", () => {
    const original = doc("[C]Hi");
    const chordId = lyric(original).chords[0].id;
    expect(lyric(moveChord(original, chordId, 1)).chords[0].position).toBe(1);
    expect(lyric(moveChord(original, chordId, -5)).chords[0].position).toBe(0);
    expect(lyric(moveChord(original, chordId, 5)).chords[0].position).toBe(2);
  });

  it("jumps to the next/previous word boundary", () => {
    const original = doc("[C]one two three");
    const chordId = lyric(original).chords[0].id;
    const forward = moveChordToBoundary(original, chordId, 1);
    expect(forward.lines).toBeDefined();
    const pos1 = lyric(forward).chords[0].position;
    const pos2 = lyric(moveChordToBoundary(forward, chordId, 1)).chords[0]
      .position;
    expect(pos2).toBeGreaterThan(pos1);
    const back = moveChordToBoundary(
      moveChordToBoundary(forward, chordId, 1),
      chordId,
      -1,
    );
    expect(lyric(back).chords[0].position).toBeLessThanOrEqual(pos2);
  });
});

describe("listChords", () => {
  it("returns chords across lines in document order", () => {
    const original = doc("[C]one [G]two\n[Am]three");
    const chords = listChords(original);
    expect(chords.map((c) => c.chord.name)).toEqual(["C", "G", "Am"]);
  });
});
