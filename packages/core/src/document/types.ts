import type { ChordDefinition } from "../chordDefinitions";

export type ChordMark = {
  id: string;
  name: string;
  /** Grapheme index into the owning line's `chars`, 0..chars.length. */
  position: number;
};

export type LyricLine = {
  kind: "lyric";
  id: string;
  /** Lyric text as extended grapheme clusters. */
  chars: string[];
  chords: ChordMark[];
};

export type HeadingBoundary = "start" | "end";
export type HeadingSection = "verse" | "chorus" | "bridge";

export type HeadingLine = {
  kind: "heading";
  id: string;
  boundary: HeadingBoundary;
  section: HeadingSection;
  /** Canonical directive text, e.g. "{start_of_chorus}". */
  raw: string;
};

export type CommentLine = {
  kind: "comment";
  id: string;
  text: string;
  /** Verbatim source text, preserved until the comment is edited. */
  raw: string;
};

export type ChordDefLine = {
  kind: "chorddef";
  id: string;
  definition: ChordDefinition;
  /** Verbatim source text, preserved until the definition is edited. */
  raw: string;
};

export type PassthroughLine = {
  kind: "passthrough";
  id: string;
  /** Any other "{...}" directive, preserved verbatim and edited only via raw source. */
  raw: string;
};

export type DocumentLine =
  | LyricLine
  | HeadingLine
  | CommentLine
  | ChordDefLine
  | PassthroughLine;

export type EditorDocument = {
  lines: DocumentLine[];
};

export type DocumentParseResult =
  | { ok: true; document: EditorDocument }
  | { ok: false; error: string };
