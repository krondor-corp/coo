import { createIdFactory, parseDocument } from "@repo/core";
import { describe, expect, it } from "vitest";
import { pdfFileName, toPrintableSong } from "../printable";

const SOURCE = `---
title: Twinkle Twinkle
author: Traditional
key: C
tempo: 120
---
{start_of_verse}
[C]Twinkle [G]twinkle
{end_of_verse}
`;

function documentFrom(source: string) {
  const result = parseDocument(source, createIdFactory());
  if (!result.ok) throw new Error(`fixture failed to parse: ${result.error}`);
  return result.document;
}

describe("toPrintableSong", () => {
  it("carries the title, author and captions through untransposed", () => {
    const song = toPrintableSong(
      documentFrom(SOURCE),
      {
        title: "Twinkle Twinkle",
        author: "Traditional",
        key: "C",
        tempo: "120",
      },
      0,
    );
    expect(song.title).toBe("Twinkle Twinkle");
    expect(song.author).toBe("Traditional");
    expect(song.captions).toEqual(["key: C", "120 bpm"]);
  });

  it("prints the key you're looking at, not the one on file", () => {
    const song = toPrintableSong(
      documentFrom(SOURCE),
      { title: "Twinkle Twinkle", key: "C" },
      2,
    );
    expect(song.captions).toContain("key: D");

    const chords = song.lines.flatMap((line) =>
      line.kind === "lyric" ? line.chords.map((c) => c.name) : [],
    );
    expect(chords).toEqual(["D", "A"]);
  });

  it("falls back to Untitled rather than printing a blank heading", () => {
    const song = toPrintableSong(documentFrom(SOURCE), { title: "   " }, 0);
    expect(song.title).toBe("Untitled");
  });

  it("collects chord definitions so they can be drawn as diagrams", () => {
    const withDefinition = `---
title: Shapes
---
{define: Bm base-fret 1 frets x 2 4 4 3 2}
[Bm]Hello
`;
    const song = toPrintableSong(
      documentFrom(withDefinition),
      { title: "Shapes" },
      0,
    );
    expect(song.chordDefinitions.map((d) => d.name)).toEqual(["Bm"]);
  });
});

describe("pdfFileName", () => {
  it("slugifies the title", () => {
    expect(pdfFileName("Twinkle Twinkle")).toBe("twinkle-twinkle.pdf");
    expect(pdfFileName("Don't Stop!")).toBe("dont-stop.pdf");
  });

  it("falls back when the title has nothing usable in it", () => {
    expect(pdfFileName("   ")).toBe("song.pdf");
    expect(pdfFileName("!!!")).toBe("song.pdf");
  });
});
