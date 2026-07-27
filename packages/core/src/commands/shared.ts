import type { DocumentLine, EditorDocument } from "../document";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lineIndexOf(doc: EditorDocument, lineId: string): number {
  return doc.lines.findIndex((line) => line.id === lineId);
}

export function replaceLine(
  doc: EditorDocument,
  index: number,
  line: DocumentLine,
): EditorDocument {
  const lines = doc.lines.slice();
  lines[index] = line;
  return { lines };
}

export function insertAfter(
  doc: EditorDocument,
  afterLineId: string | null,
  line: DocumentLine,
): EditorDocument {
  const index = afterLineId ? lineIndexOf(doc, afterLineId) : -1;
  const insertAt = index === -1 ? doc.lines.length : index + 1;
  const lines = doc.lines.slice();
  lines.splice(insertAt, 0, line);
  return { lines };
}

export function removeLineAt(
  doc: EditorDocument,
  index: number,
): EditorDocument {
  const lines = doc.lines.slice();
  lines.splice(index, 1);
  return { lines };
}
