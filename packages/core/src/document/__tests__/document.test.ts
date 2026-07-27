import { describe, expect, it } from "vitest";
import { parseDocument, serializeDocument } from "../document";
import { createIdFactory } from "../ids";
import type { LyricLine } from "../types";

function roundTrip(source: string): string {
  const result = parseDocument(source);
  if (!result.ok) throw new Error(result.error);
  return serializeDocument(source, result.document);
}

describe("parseDocument / serializeDocument round trip", () => {
  it("reproduces a simple lyric document byte-for-byte", () => {
    const source = "---\ntitle: Test\n---\n[Am]Twinkle [C]little [F]star\n";
    expect(roundTrip(source)).toBe(source);
  });

  it("preserves blank lines and indentation", () => {
    const source = "---\ntitle: Test\n---\n[C]First line\n\n  indented lyric\n";
    expect(roundTrip(source)).toBe(source);
  });

  it("preserves stray/unbalanced brackets verbatim", () => {
    const source = "---\ntitle: Test\n---\n[C]Hello [ world\n";
    expect(roundTrip(source)).toBe(source);
  });

  it("preserves headings, comments, chord definitions, and unknown directives", () => {
    const source = [
      "---",
      "title: Test",
      "---",
      "{start_of_chorus}",
      "{comment: sing louder here}",
      "{define: C base-fret 1 frets x 3 2 0 1 0}",
      "{some_unknown_directive: value}",
      "[C]La la [G]la",
      "{end_of_chorus}",
      "",
    ].join("\n");
    expect(roundTrip(source)).toBe(source);
  });

  it("preserves unicode grapheme clusters exactly (combining marks, emoji)", () => {
    const source = "---\ntitle: Test\n---\n[C]café \u{1F3B8}\n";
    expect(roundTrip(source)).toBe(source);
  });

  it("does not touch frontmatter content", () => {
    const source = "---\ntitle: Test\ncustom: keep me\n---\n[C]Hello\n";
    const result = parseDocument(source);
    if (!result.ok) throw new Error(result.error);
    expect(serializeDocument(source, result.document)).toContain(
      "custom: keep me",
    );
  });
});

describe("parseDocument line kinds", () => {
  it("parses multiple chords at distinct positions in document order", () => {
    const result = parseDocument(
      "---\ntitle: Test\n---\n[Am]Twin[C]kle [F]little\n",
    );
    if (!result.ok) throw new Error(result.error);
    const line = result.document.lines[0] as LyricLine;
    expect(line.kind).toBe("lyric");
    expect(line.chords.map((c) => [c.name, c.position])).toEqual([
      ["Am", 0],
      ["C", 4],
      ["F", 8],
    ]);
  });

  it("returns a typed error for malformed metadata instead of throwing", () => {
    const result = parseDocument("---\ntitle: Test\ntempo: fast\n---\nHi\n");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Invalid tempo");
  });

  it("returns a typed error when frontmatter is missing entirely", () => {
    const result = parseDocument("just some lyrics, no frontmatter");
    expect(result.ok).toBe(false);
  });
});

describe("createIdFactory", () => {
  it("assigns unique, deterministic-per-call ids across all lines and chords", () => {
    const makeId = createIdFactory();
    const result = parseDocument(
      "---\ntitle: Test\n---\n[Am]One\n[C]Two\n",
      makeId,
    );
    if (!result.ok) throw new Error(result.error);
    const ids = result.document.lines.flatMap((line) => [
      line.id,
      ...(line.kind === "lyric" ? line.chords.map((c) => c.id) : []),
    ]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
