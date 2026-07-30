import { describe, expect, it } from "vitest";
import {
  createIdFactory,
  parseDocument,
  serializeDocument,
} from "../../document";
import { insertChordAt } from "../chords";
import {
  insertBlankLyricLineAfter,
  mergeLineUp,
  setLyricText,
  splitLine,
} from "../lyric";
import { doc, lyric } from "./helpers";

describe("setLyricText", () => {
  it("shifts chords after an inserted region", () => {
    const makeId = createIdFactory();
    const original = doc("[C]Hello world", makeId);
    const lineId = lyric(original).id;
    const chordId = lyric(original).chords[0].id;
    const secondChordDoc = insertChordAt(original, lineId, 6, "G", makeId);
    const edited = setLyricText(secondChordDoc, lineId, "Hello there world");
    const chords = lyric(edited).chords;
    expect(chords.find((c) => c.id === chordId)?.position).toBe(0);
    // "there " (6 chars) inserted before the G at position 6 should push it forward.
    expect(chords.find((c) => c.name === "G")?.position).toBe(12);
  });

  it("collapses a chord inside a deleted region to the edit point", () => {
    const makeId = createIdFactory();
    const original = doc("[C]Hello world", makeId);
    const lineId = lyric(original).id;
    const withSecond = insertChordAt(original, lineId, 6, "G", makeId);
    // Delete "world" (the tail) — the G chord at position 6 sits right at the new end.
    const edited = setLyricText(withSecond, lineId, "Hello ");
    const g = lyric(edited).chords.find((c) => c.name === "G");
    expect(g?.position).toBeLessThanOrEqual(6);
  });

  it("leaves chords before the edit untouched", () => {
    const original = doc("[C]Hello");
    const lineId = lyric(original).id;
    const edited = setLyricText(original, lineId, "Hello there");
    expect(lyric(edited).chords[0].position).toBe(0);
  });

  it("keeps a chord parked at the end of the line put while you keep typing", () => {
    const makeId = createIdFactory();
    const original = doc("Hello", makeId);
    const lineId = lyric(original).id;
    // A chord inserted with the caret at end-of-line isn't above any character
    // yet — it marks where the next word will be sung.
    const withChord = insertChordAt(original, lineId, 5, "G", makeId);
    expect(lyric(withChord).chords[0].position).toBe(5);

    // Typing the word it belongs to must not drag it along behind the caret.
    let edited = setLyricText(withChord, lineId, "Hello ");
    expect(lyric(edited).chords[0].position).toBe(5);

    edited = setLyricText(edited, lineId, "Hello t");
    expect(lyric(edited).chords[0].position).toBe(5);

    edited = setLyricText(edited, lineId, "Hello there");
    expect(lyric(edited).chords[0].position).toBe(5);
  });

  it("keeps a chord on an otherwise empty line put once lyrics arrive", () => {
    const makeId = createIdFactory();
    const original = doc("", makeId);
    const lineId = lyric(original).id;
    const withChord = insertChordAt(original, lineId, 0, "Am", makeId);

    const edited = setLyricText(withChord, lineId, "Sing");
    expect(lyric(edited).chords[0].position).toBe(0);
  });

  it("still keeps a trailing chord trailing when the edit is mid-line", () => {
    const makeId = createIdFactory();
    const original = doc("Hello", makeId);
    const lineId = lyric(original).id;
    const withChord = insertChordAt(original, lineId, 5, "G", makeId);

    // Inserting earlier in the line genuinely does push the trailing chord along.
    const edited = setLyricText(withChord, lineId, "HeXllo");
    expect(lyric(edited).chords[0].position).toBe(6);
  });

  it("pulls a trailing chord back in when the text shrinks", () => {
    const makeId = createIdFactory();
    const original = doc("Hello", makeId);
    const lineId = lyric(original).id;
    const withChord = insertChordAt(original, lineId, 5, "G", makeId);

    const edited = setLyricText(withChord, lineId, "Hell");
    expect(lyric(edited).chords[0].position).toBe(4);
  });
});

describe("splitLine / mergeLineUp", () => {
  it("splits a line and rebases trailing chords onto the new line", () => {
    const original = doc("[C]Hello [G]world");
    const lineId = lyric(original).id;
    const split = splitLine(original, lineId, 6, createIdFactory());
    expect(split.lines).toHaveLength(2);
    const first = lyric(split, 0);
    const second = lyric(split, 1);
    expect(first.chords.map((c) => c.name)).toEqual(["C"]);
    expect(second.chords.map((c) => [c.name, c.position])).toEqual([["G", 0]]);
  });

  it("round trips split + merge back to the original serialized line", () => {
    const source = "---\ntitle: Test\n---\n[C]Hello [G]world\n";
    const parsed = parseDocument(source);
    if (!parsed.ok) throw new Error(parsed.error);
    const lineId = lyric(parsed.document).id;
    const split = splitLine(parsed.document, lineId, 6, createIdFactory());
    const merged = mergeLineUp(split, split.lines[1].id);
    expect(serializeDocument(source, merged)).toBe(source);
  });

  it("deletes a non-lyric previous line instead of merging into it", () => {
    const original = doc("{comment: note}\nHello");
    const lineId = original.lines[1].id;
    const merged = mergeLineUp(original, lineId);
    expect(merged.lines).toHaveLength(1);
    expect(merged.lines[0].id).toBe(lineId);
    expect(merged.lines[0].kind).toBe("lyric");
  });

  it("is a no-op for the first line", () => {
    const original = doc("Hello");
    const merged = mergeLineUp(original, original.lines[0].id);
    expect(merged).toBe(original);
  });
});

describe("insertBlankLyricLineAfter", () => {
  it("appends a blank lyric line after a trailing non-lyric line", () => {
    const makeId = createIdFactory();
    const original = doc("Hello\n{comment: note}", makeId);
    const lastLine = original.lines[original.lines.length - 1];
    const next = insertBlankLyricLineAfter(original, lastLine.id, makeId);
    expect(next.lines).toHaveLength(3);
    const added = next.lines[2];
    expect(added.kind).toBe("lyric");
    expect(added.kind === "lyric" && added.chars).toEqual([]);
  });
});
