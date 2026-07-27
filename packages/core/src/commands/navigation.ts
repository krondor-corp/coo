import type { EditorDocument, LyricLine } from "../document";

/** The nearest lyric line above (-1) or below (1) `lineId`, skipping over non-lyric lines. */
export function adjacentLyricLine(
  doc: EditorDocument,
  lineId: string,
  direction: 1 | -1,
): LyricLine | null {
  const index = doc.lines.findIndex((line) => line.id === lineId);
  if (index === -1) return null;
  for (
    let i = index + direction;
    i >= 0 && i < doc.lines.length;
    i += direction
  ) {
    const line = doc.lines[i];
    if (line.kind === "lyric") return line;
  }
  return null;
}
