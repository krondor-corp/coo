import type { EditorDocument } from "../document";
import { transposeKey } from "../transpose";

/** Transposes every chord in the document by `semitones`. Chord suffixes (maj7, sus4, m, ...) are preserved. */
export function transposeDocument(
  doc: EditorDocument,
  semitones: number,
): EditorDocument {
  if (semitones === 0) return doc;
  const lines = doc.lines.map((line) => {
    if (line.kind !== "lyric" || line.chords.length === 0) return line;
    return {
      ...line,
      chords: line.chords.map((chord) => ({
        ...chord,
        name: transposeKey(chord.name, semitones),
      })),
    };
  });
  return { lines };
}
