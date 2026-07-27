import {
  type ChordMark,
  type EditorDocument,
  type IdFactory,
  type LyricLine,
  toGraphemes,
} from "../document";
import {
  clamp,
  insertAfter,
  lineIndexOf,
  removeLineAt,
  replaceLine,
} from "./shared";

function commonPrefixLength(a: string[], b: string[]): number {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) i++;
  return i;
}

function commonSuffixLength(a: string[], b: string[], prefix: number): number {
  const max = Math.min(a.length, b.length) - prefix;
  let i = 0;
  while (i < max && a[a.length - 1 - i] === b[b.length - 1 - i]) i++;
  return i;
}

/**
 * Replaces a lyric line's text (e.g. from a textarea onChange) and rebases
 * chord positions around the edited region: chords before it are untouched,
 * chords after it shift by the length delta, chords inside it collapse to
 * the edit's start.
 */
export function setLyricText(
  doc: EditorDocument,
  lineId: string,
  text: string,
): EditorDocument {
  const index = lineIndexOf(doc, lineId);
  const line = doc.lines[index];
  if (!line || line.kind !== "lyric") return doc;

  const newChars = toGraphemes(text);
  const prefix = commonPrefixLength(line.chars, newChars);
  const suffix = commonSuffixLength(line.chars, newChars, prefix);
  const editOldEnd = line.chars.length - suffix;
  const delta = newChars.length - line.chars.length;

  const chords = line.chords.map((chord) => {
    if (chord.position < prefix) return chord;
    if (chord.position >= editOldEnd)
      return { ...chord, position: chord.position + delta };
    return { ...chord, position: prefix };
  });

  return replaceLine(doc, index, { ...line, chars: newChars, chords });
}

/** Appends a blank lyric line after `afterLineId` (or at the end if null). */
export function insertBlankLyricLineAfter(
  doc: EditorDocument,
  afterLineId: string | null,
  makeId: IdFactory,
): EditorDocument {
  return insertAfter(doc, afterLineId, {
    kind: "lyric",
    id: makeId(),
    chars: [],
    chords: [],
  });
}

/** Enter: splits a lyric line at `position`, rebasing trailing chords onto the new line. */
export function splitLine(
  doc: EditorDocument,
  lineId: string,
  position: number,
  makeId: IdFactory,
): EditorDocument {
  const index = lineIndexOf(doc, lineId);
  const line = doc.lines[index];
  if (!line || line.kind !== "lyric") return doc;

  const pos = clamp(position, 0, line.chars.length);
  const firstChords: ChordMark[] = [];
  const secondChords: ChordMark[] = [];
  for (const chord of line.chords) {
    if (chord.position < pos) firstChords.push(chord);
    else secondChords.push({ ...chord, position: chord.position - pos });
  }

  const first: LyricLine = {
    ...line,
    chars: line.chars.slice(0, pos),
    chords: firstChords,
  };
  const second: LyricLine = {
    kind: "lyric",
    id: makeId(),
    chars: line.chars.slice(pos),
    chords: secondChords,
  };

  const lines = doc.lines.slice();
  lines.splice(index, 1, first, second);
  return { lines };
}

/**
 * Backspace at column 0: merges a lyric line into the previous one. If the
 * previous line isn't lyric (a heading, comment, or chord definition), it is
 * simply deleted instead, since there's no text to merge.
 */
export function mergeLineUp(
  doc: EditorDocument,
  lineId: string,
): EditorDocument {
  const index = lineIndexOf(doc, lineId);
  if (index <= 0) return doc;
  const current = doc.lines[index];
  const previous = doc.lines[index - 1];
  if (current.kind !== "lyric") return doc;
  if (previous.kind !== "lyric") return removeLineAt(doc, index - 1);

  const offset = previous.chars.length;
  const merged: LyricLine = {
    kind: "lyric",
    id: previous.id,
    chars: [...previous.chars, ...current.chars],
    chords: [
      ...previous.chords,
      ...current.chords.map((chord) => ({
        ...chord,
        position: chord.position + offset,
      })),
    ],
  };

  const lines = doc.lines.slice();
  lines.splice(index - 1, 2, merged);
  return { lines };
}
