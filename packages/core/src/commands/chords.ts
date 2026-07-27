import type {
  ChordMark,
  EditorDocument,
  IdFactory,
  LyricLine,
} from "../document";
import { clamp, lineIndexOf, replaceLine } from "./shared";
import type { ChordLocation } from "./types";

function findChord(
  doc: EditorDocument,
  chordId: string,
): { lineIndex: number; line: LyricLine; chordIndex: number } | null {
  for (let lineIndex = 0; lineIndex < doc.lines.length; lineIndex++) {
    const line = doc.lines[lineIndex];
    if (line.kind !== "lyric") continue;
    const chordIndex = line.chords.findIndex((chord) => chord.id === chordId);
    if (chordIndex !== -1) return { lineIndex, line, chordIndex };
  }
  return null;
}

/** All chords in document order, for chord-to-chord keyboard navigation. */
export function listChords(doc: EditorDocument): ChordLocation[] {
  const result: ChordLocation[] = [];
  for (const line of doc.lines) {
    if (line.kind !== "lyric") continue;
    for (const chord of [...line.chords].sort(
      (a, b) => a.position - b.position,
    )) {
      result.push({ chord, lineId: line.id });
    }
  }
  return result;
}

export function insertChordAt(
  doc: EditorDocument,
  lineId: string,
  position: number,
  name: string,
  makeId: IdFactory,
): EditorDocument {
  const index = lineIndexOf(doc, lineId);
  const line = doc.lines[index];
  if (!line || line.kind !== "lyric") return doc;
  const clamped = clamp(position, 0, line.chars.length);
  const chord: ChordMark = { id: makeId(), name, position: clamped };
  return replaceLine(doc, index, { ...line, chords: [...line.chords, chord] });
}

export function renameChord(
  doc: EditorDocument,
  chordId: string,
  name: string,
): EditorDocument {
  const found = findChord(doc, chordId);
  if (!found) return doc;
  const { lineIndex, line, chordIndex } = found;
  const chords = line.chords.slice();
  chords[chordIndex] = { ...chords[chordIndex], name };
  return replaceLine(doc, lineIndex, { ...line, chords });
}

export function deleteChord(
  doc: EditorDocument,
  chordId: string,
): EditorDocument {
  const found = findChord(doc, chordId);
  if (!found) return doc;
  const { lineIndex, line, chordIndex } = found;
  const chords = line.chords.slice();
  chords.splice(chordIndex, 1);
  return replaceLine(doc, lineIndex, { ...line, chords });
}

export function moveChord(
  doc: EditorDocument,
  chordId: string,
  delta: number,
): EditorDocument {
  const found = findChord(doc, chordId);
  if (!found) return doc;
  const { lineIndex, line, chordIndex } = found;
  const chord = line.chords[chordIndex];
  const position = clamp(chord.position + delta, 0, line.chars.length);
  const chords = line.chords.slice();
  chords[chordIndex] = { ...chord, position };
  return replaceLine(doc, lineIndex, { ...line, chords });
}

const BOUNDARY_RE = /[\s\-.,;:!?]/;

function nextBoundary(
  chars: string[],
  from: number,
  direction: 1 | -1,
): number {
  const isBoundary = (ch: string | undefined) =>
    ch === undefined || BOUNDARY_RE.test(ch);
  let i = from;
  if (direction === 1) {
    while (i < chars.length && !isBoundary(chars[i])) i++;
    while (i < chars.length && isBoundary(chars[i])) i++;
    return i;
  }
  while (i > 0 && isBoundary(chars[i - 1])) i--;
  while (i > 0 && !isBoundary(chars[i - 1])) i--;
  return i;
}

export function moveChordToBoundary(
  doc: EditorDocument,
  chordId: string,
  direction: 1 | -1,
): EditorDocument {
  const found = findChord(doc, chordId);
  if (!found) return doc;
  const { lineIndex, line, chordIndex } = found;
  const chord = line.chords[chordIndex];
  const position = nextBoundary(line.chars, chord.position, direction);
  const chords = line.chords.slice();
  chords[chordIndex] = { ...chord, position };
  return replaceLine(doc, lineIndex, { ...line, chords });
}
