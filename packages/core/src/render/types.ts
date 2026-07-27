import type { ChordDefinition } from "../chordDefinitions";

export type RenderedSong = {
  html: string;
  chordDefinitions: ChordDefinition[];
};

export type SplitHtml = {
  before: string;
  after: string;
};
