import { describe, expect, it } from "vitest";
import { type LyricLine, createIdFactory } from "../../document";
import {
  convertLyricToComment,
  deleteLine,
  insertComment,
  insertHeadingBlock,
  updateComment,
  upsertChordDefinition,
} from "../structure";
import { doc } from "./helpers";

describe("insertHeadingBlock", () => {
  it("inserts a start/blank/end heading block", () => {
    const makeId = createIdFactory();
    const original = doc("Hello", makeId);
    const withHeading = insertHeadingBlock(
      original,
      original.lines[0].id,
      "chorus",
      makeId,
    );
    expect(withHeading.lines.map((l) => l.kind)).toEqual([
      "lyric",
      "heading",
      "lyric",
      "heading",
    ]);
    const [, start, , end] = withHeading.lines;
    expect(start.kind === "heading" && start.raw).toBe("{start_of_chorus}");
    expect(end.kind === "heading" && end.raw).toBe("{end_of_chorus}");
  });

  it("clones the first existing chorus when a chorus repeats, with fresh ids", () => {
    const makeId = createIdFactory();
    const original = doc(
      "{start_of_chorus}\n[C]La [G]la\n{end_of_chorus}\nBridge here",
      makeId,
    );
    const chorusStart = original.lines[0];
    const chorusLyric = original.lines[1] as LyricLine;
    const lastLine = original.lines[original.lines.length - 1];

    const withRepeat = insertHeadingBlock(
      original,
      lastLine.id,
      "chorus",
      makeId,
    );
    const inserted = withRepeat.lines.slice(-3);
    expect(inserted.map((l) => l.kind)).toEqual([
      "heading",
      "lyric",
      "heading",
    ]);

    const clonedLyric = inserted[1] as LyricLine;
    expect(clonedLyric.chars.join("")).toBe(chorusLyric.chars.join(""));
    expect(clonedLyric.chords.map((c) => [c.name, c.position])).toEqual(
      chorusLyric.chords.map((c) => [c.name, c.position]),
    );
    expect(clonedLyric.id).not.toBe(chorusLyric.id);
    expect(clonedLyric.chords[0].id).not.toBe(chorusLyric.chords[0].id);
    expect(inserted[0].id).not.toBe(chorusStart.id);
  });

  it("always starts a new verse blank, even if a verse already exists", () => {
    const makeId = createIdFactory();
    const original = doc(
      "{start_of_verse}\n[C]Verse one\n{end_of_verse}",
      makeId,
    );
    const withVerse = insertHeadingBlock(
      original,
      original.lines[2].id,
      "verse",
      makeId,
    );
    const inserted = withVerse.lines.slice(-3);
    const insertedLyric = inserted[1] as LyricLine;
    expect(insertedLyric.chars).toEqual([]);
    expect(insertedLyric.chords).toEqual([]);
  });
});

describe("insertComment / updateComment", () => {
  it("inserts and updates a comment", () => {
    const makeId = createIdFactory();
    const original = doc("Hello", makeId);
    const withComment = insertComment(
      original,
      original.lines[0].id,
      "sing louder",
      makeId,
    );
    const commentLine = withComment.lines[1];
    expect(commentLine.kind === "comment" && commentLine.raw).toBe(
      "{comment: sing louder}",
    );
    const updated = updateComment(withComment, commentLine.id, "even louder");
    const updatedLine = updated.lines[1];
    expect(updatedLine.kind === "comment" && updatedLine.text).toBe(
      "even louder",
    );
  });
});

describe("convertLyricToComment", () => {
  it("converts a lyric line into a comment, carrying over its text", () => {
    const makeId = createIdFactory();
    const original = doc("sing louder here", makeId);
    const lyricId = original.lines[0].id;
    const converted = convertLyricToComment(original, lyricId, makeId);
    expect(converted.lines).toHaveLength(1);
    const line = converted.lines[0];
    expect(line.kind).toBe("comment");
    expect(line.kind === "comment" && line.text).toBe("sing louder here");
    expect(line.kind === "comment" && line.raw).toBe(
      "{comment: sing louder here}",
    );
    expect(line.id).not.toBe(lyricId);
  });

  it("drops any chords on the converted line — comments don't carry chords", () => {
    const makeId = createIdFactory();
    const original = doc("[C]sing [G]louder", makeId);
    const converted = convertLyricToComment(
      original,
      original.lines[0].id,
      makeId,
    );
    const line = converted.lines[0];
    expect(line.kind === "comment" && line.text).toBe("sing louder");
  });

  it("is a no-op on a non-lyric line", () => {
    const makeId = createIdFactory();
    const original = doc("{comment: already a comment}", makeId);
    const result = convertLyricToComment(
      original,
      original.lines[0].id,
      makeId,
    );
    expect(result).toBe(original);
  });
});

describe("upsertChordDefinition", () => {
  it("creates then updates a chord definition for the same name in place", () => {
    const makeId = createIdFactory();
    const original = doc("Hello", makeId);
    const def = {
      name: "C",
      baseFret: 1,
      frets: ["x", 3, 2, 0, 1, 0] as (number | "x")[],
      fingers: [],
    };
    const withDef = upsertChordDefinition(
      original,
      original.lines[0].id,
      def,
      makeId,
    );
    expect(withDef.lines).toHaveLength(2);

    const updatedDef = { ...def, baseFret: 3 };
    const updated = upsertChordDefinition(withDef, null, updatedDef, makeId);
    expect(updated.lines).toHaveLength(2);
    const chorddefLine = updated.lines[1];
    expect(
      chorddefLine.kind === "chorddef" && chorddefLine.definition.baseFret,
    ).toBe(3);
  });
});

describe("deleteLine", () => {
  it("removes a chord definition line entirely", () => {
    const makeId = createIdFactory();
    const original = doc("Hello", makeId);
    const def = {
      name: "C",
      baseFret: 1,
      frets: ["x", 3, 2, 0, 1, 0] as (number | "x")[],
      fingers: [],
    };
    const withDef = upsertChordDefinition(
      original,
      original.lines[0].id,
      def,
      makeId,
    );
    expect(withDef.lines).toHaveLength(2);
    const deleted = deleteLine(withDef, withDef.lines[1].id);
    expect(deleted.lines).toHaveLength(1);
    expect(deleted.lines[0].id).toBe(withDef.lines[0].id);
  });

  it("is a no-op for an unknown line id", () => {
    const original = doc("Hello");
    const deleted = deleteLine(original, "nonexistent");
    expect(deleted).toBe(original);
  });
});
