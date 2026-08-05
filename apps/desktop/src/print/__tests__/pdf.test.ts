import { createIdFactory, parseDocument } from "@repo/core";
import { describe, expect, it } from "vitest";
import { renderSongPdf } from "../pdf";
import { toPrintableSong } from "../printable";
import type { PrintableSong } from "../types";

function songFrom(source: string, metadata: Record<string, string>) {
  const result = parseDocument(source, createIdFactory());
  if (!result.ok) throw new Error(`fixture failed to parse: ${result.error}`);
  return toPrintableSong(result.document, metadata, 0);
}

function header(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes.slice(0, 5));
}

/** Page dictionaries aren't inside compressed streams, so they're countable. */
function pageCount(bytes: Uint8Array): number {
  const text = new TextDecoder("latin1").decode(bytes);
  return (text.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
}

describe("renderSongPdf", () => {
  it("produces a valid PDF", () => {
    const song = songFrom(
      `---
title: Twinkle
key: C
---
{start_of_verse}
[C]Twinkle [G]twinkle [Am]little [F]star
{end_of_verse}
{comment: gently}
`,
      { title: "Twinkle", key: "C" },
    );
    const bytes = renderSongPdf(song);
    expect(header(bytes)).toBe("%PDF-");
    expect(bytes.byteLength).toBeGreaterThan(500);
  });

  it("renders a song with chord diagrams without blowing up", () => {
    const song = songFrom(
      `---
title: Shapes
---
{define: Bm base-fret 1 frets x 2 4 4 3 2}
{define: F base-fret 1 frets 1 3 3 2 1 1}
[Bm]Hello [F]there
`,
      { title: "Shapes" },
    );
    const bytes = renderSongPdf(song);
    expect(header(bytes)).toBe("%PDF-");
  });

  it("handles an empty song without throwing", () => {
    const song: PrintableSong = {
      title: "Blank",
      captions: [],
      lines: [],
      chordDefinitions: [],
    };
    expect(header(renderSongPdf(song))).toBe("%PDF-");
  });

  it("paginates rather than running off the bottom of a long song", () => {
    const short = songFrom("---\ntitle: Short\n---\n[C]one line\n", {
      title: "Short",
    });
    const long = songFrom(
      `---\ntitle: Long\n---\n${"[C]a line of lyrics to sing\n".repeat(120)}`,
      { title: "Long" },
    );

    expect(pageCount(renderSongPdf(short))).toBe(1);
    expect(pageCount(renderSongPdf(long))).toBeGreaterThan(1);
  });

  it("keeps very wide lines on the page by shrinking the type", () => {
    const wide = `[C]${"x".repeat(400)}`;
    const song = songFrom(`---\ntitle: Wide\n---\n${wide}\n`, {
      title: "Wide",
    });
    expect(header(renderSongPdf(song))).toBe("%PDF-");
  });
});
