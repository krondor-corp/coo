import type { ChordDefinition, DocumentLine } from "@repo/core";

/**
 * A song reduced to exactly what goes on paper. Already transposed — whatever
 * key this says is the key that prints.
 */
export type PrintableSong = {
  title: string;
  author?: string;
  /** Pre-formatted caption parts, e.g. ["key: D", "120 bpm"]. */
  captions: string[];
  lines: DocumentLine[];
  chordDefinitions: ChordDefinition[];
};
