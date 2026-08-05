import {
  type EditorDocument,
  transposeDocument,
  transposeKey,
} from "@repo/core";
import type { PrintableSong } from "./types";

/**
 * Reduces the live document to what belongs on paper, applying the view's
 * transposition. Transposing happens here rather than being passed in
 * pre-applied so that printing can't drift from what's on screen.
 */
export function toPrintableSong(
  document: EditorDocument,
  metadata: Record<string, string>,
  transposeOffset: number,
): PrintableSong {
  const shifted =
    transposeOffset === 0
      ? document
      : transposeDocument(document, transposeOffset);

  const key =
    metadata.key && transposeOffset !== 0
      ? transposeKey(metadata.key, transposeOffset)
      : metadata.key;

  const captions = [
    key && `key: ${key}`,
    metadata.tempo && `${metadata.tempo} bpm`,
    metadata.capo && `capo ${metadata.capo}`,
    metadata.tuning && `tuning: ${metadata.tuning}`,
  ].filter((part): part is string => Boolean(part));

  return {
    title: metadata.title?.trim() || "Untitled",
    author: metadata.author?.trim() || undefined,
    captions,
    lines: shifted.lines,
    chordDefinitions: shifted.lines
      .filter((line) => line.kind === "chorddef")
      .map((line) => (line.kind === "chorddef" ? line.definition : null))
      .filter((definition): definition is NonNullable<typeof definition> =>
        Boolean(definition),
      ),
  };
}

/** A filename suggestion for the save dialog, derived from the song's title. */
export function pdfFileName(title: string): string {
  const slug = title
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
  return `${slug || "song"}.pdf`;
}
