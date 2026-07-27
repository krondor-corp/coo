import {
  type ChordDefinition,
  formatChordDefinition,
} from "../chordDefinitions";
import {
  type DocumentLine,
  type EditorDocument,
  type HeadingSection,
  type IdFactory,
  formatComment,
  formatHeading,
} from "../document";
import { insertAfter, lineIndexOf, removeLineAt, replaceLine } from "./shared";

/** The lines strictly between the first {start_of_section}/{end_of_section} pair for `section`, if any. */
function findFirstBlockBody(
  doc: EditorDocument,
  section: HeadingSection,
): DocumentLine[] | null {
  const startIndex = doc.lines.findIndex(
    (line) =>
      line.kind === "heading" &&
      line.boundary === "start" &&
      line.section === section,
  );
  if (startIndex === -1) return null;

  for (let i = startIndex + 1; i < doc.lines.length; i++) {
    const line = doc.lines[i];
    if (
      line.kind === "heading" &&
      line.boundary === "end" &&
      line.section === section
    ) {
      return doc.lines.slice(startIndex + 1, i);
    }
  }
  return null;
}

/** Deep-copies a line with fresh ids (and fresh chord ids for lyric lines), so a cloned block never shares identity with its source. */
function cloneLineWithFreshIds(
  line: DocumentLine,
  makeId: IdFactory,
): DocumentLine {
  if (line.kind === "lyric") {
    return {
      kind: "lyric",
      id: makeId(),
      chars: [...line.chars],
      chords: line.chords.map((chord) => ({ ...chord, id: makeId() })),
    };
  }
  return { ...line, id: makeId() };
}

/**
 * Inserts a {start_of_section}/.../{end_of_section} block after `afterLineId` (or at the end if null).
 * For "chorus" and "bridge" — sections that are typically repeated verbatim — this clones the first
 * existing occurrence of that section in the document instead of starting blank, since restating a
 * chorus/bridge from scratch is rarely what the author wants. "verse" always starts blank.
 */
export function insertHeadingBlock(
  doc: EditorDocument,
  afterLineId: string | null,
  section: HeadingSection,
  makeId: IdFactory,
): EditorDocument {
  const start: DocumentLine = {
    kind: "heading",
    id: makeId(),
    boundary: "start",
    section,
    raw: formatHeading("start", section),
  };

  const existingBody =
    section === "verse" ? null : findFirstBlockBody(doc, section);
  const body: DocumentLine[] = existingBody
    ? existingBody.map((line) => cloneLineWithFreshIds(line, makeId))
    : [{ kind: "lyric", id: makeId(), chars: [], chords: [] }];

  const end: DocumentLine = {
    kind: "heading",
    id: makeId(),
    boundary: "end",
    section,
    raw: formatHeading("end", section),
  };

  const index = afterLineId ? lineIndexOf(doc, afterLineId) : -1;
  const insertAt = index === -1 ? doc.lines.length : index + 1;
  const lines = doc.lines.slice();
  lines.splice(insertAt, 0, start, ...body, end);
  return { lines };
}

export function insertComment(
  doc: EditorDocument,
  afterLineId: string | null,
  text: string,
  makeId: IdFactory,
): EditorDocument {
  return insertAfter(doc, afterLineId, {
    kind: "comment",
    id: makeId(),
    text,
    raw: formatComment(text),
  });
}

export function updateComment(
  doc: EditorDocument,
  lineId: string,
  text: string,
): EditorDocument {
  const index = lineIndexOf(doc, lineId);
  const line = doc.lines[index];
  if (!line || line.kind !== "comment") return doc;
  return replaceLine(doc, index, { ...line, text, raw: formatComment(text) });
}

/** Typing ">" at the start of a lyric line converts it into a comment, carrying over any text already there. */
export function convertLyricToComment(
  doc: EditorDocument,
  lineId: string,
  makeId: IdFactory,
): EditorDocument {
  const index = lineIndexOf(doc, lineId);
  const line = doc.lines[index];
  if (!line || line.kind !== "lyric") return doc;
  const text = line.chars.join("");
  return replaceLine(doc, index, {
    kind: "comment",
    id: makeId(),
    text,
    raw: formatComment(text),
  });
}

/** Creates a chord definition, or updates the existing one for the same chord name in place. */
export function upsertChordDefinition(
  doc: EditorDocument,
  afterLineId: string | null,
  definition: ChordDefinition,
  makeId: IdFactory,
): EditorDocument {
  const existingIndex = doc.lines.findIndex(
    (line) =>
      line.kind === "chorddef" && line.definition.name === definition.name,
  );
  const raw = formatChordDefinition(definition);

  if (existingIndex !== -1) {
    const existing = doc.lines[existingIndex];
    return replaceLine(doc, existingIndex, {
      kind: "chorddef",
      id: existing.id,
      definition,
      raw,
    });
  }

  return insertAfter(doc, afterLineId, {
    kind: "chorddef",
    id: makeId(),
    definition,
    raw,
  });
}

/** Removes a line (chord definition, heading, comment, or passthrough) entirely. */
export function deleteLine(
  doc: EditorDocument,
  lineId: string,
): EditorDocument {
  const index = lineIndexOf(doc, lineId);
  if (index === -1) return doc;
  return removeLineAt(doc, index);
}
