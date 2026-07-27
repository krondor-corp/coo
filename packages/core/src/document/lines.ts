import { parseChordDefinitions } from "../chordDefinitions";
import { toGraphemes } from "./graphemes";
import type { IdFactory } from "./ids";
import type {
  ChordMark,
  DocumentLine,
  HeadingBoundary,
  HeadingSection,
} from "./types";

const HEADING_RE = /^\{(start|end)_of_(verse|chorus|bridge)\}$/i;
const COMMENT_RE = /^\{comment:\s*(.*)\}$/i;
const CHORD_TOKEN_RE = /\[([^[\]]*)\]/g;

export function formatHeading(
  boundary: HeadingBoundary,
  section: HeadingSection,
): string {
  return `{${boundary}_of_${section}}`;
}

export function formatComment(text: string): string {
  return `{comment: ${text}}`;
}

function parseLyricLine(raw: string, makeId: IdFactory): DocumentLine {
  const chords: ChordMark[] = [];
  let lyricText = "";
  let lastIndex = 0;
  CHORD_TOKEN_RE.lastIndex = 0;
  let match: RegExpExecArray | null = CHORD_TOKEN_RE.exec(raw);
  while (match !== null) {
    lyricText += raw.slice(lastIndex, match.index);
    chords.push({
      id: makeId(),
      name: match[1],
      position: toGraphemes(lyricText).length,
    });
    lastIndex = CHORD_TOKEN_RE.lastIndex;
    match = CHORD_TOKEN_RE.exec(raw);
  }
  lyricText += raw.slice(lastIndex);
  return { kind: "lyric", id: makeId(), chars: toGraphemes(lyricText), chords };
}

export function parseLine(raw: string, makeId: IdFactory): DocumentLine {
  if (!raw.startsWith("{")) return parseLyricLine(raw, makeId);

  const heading = raw.match(HEADING_RE);
  if (heading) {
    return {
      kind: "heading",
      id: makeId(),
      boundary: heading[1].toLowerCase() as HeadingBoundary,
      section: heading[2].toLowerCase() as HeadingSection,
      raw,
    };
  }

  const comment = raw.match(COMMENT_RE);
  if (comment) {
    return { kind: "comment", id: makeId(), text: comment[1], raw };
  }

  const { chordDefinitions } = parseChordDefinitions(raw);
  if (chordDefinitions.length === 1) {
    return {
      kind: "chorddef",
      id: makeId(),
      definition: chordDefinitions[0],
      raw,
    };
  }

  return { kind: "passthrough", id: makeId(), raw };
}

export function serializeLine(line: DocumentLine): string {
  switch (line.kind) {
    case "lyric": {
      const byPosition = new Map<number, ChordMark[]>();
      for (const chord of line.chords) {
        const list = byPosition.get(chord.position);
        if (list) list.push(chord);
        else byPosition.set(chord.position, [chord]);
      }
      let out = "";
      for (let i = 0; i <= line.chars.length; i++) {
        for (const chord of byPosition.get(i) ?? []) out += `[${chord.name}]`;
        if (i < line.chars.length) out += line.chars[i];
      }
      return out;
    }
    case "heading":
    case "comment":
    case "chorddef":
    case "passthrough":
      return line.raw;
  }
}
