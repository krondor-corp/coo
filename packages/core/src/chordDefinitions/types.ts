export type ChordDefinition = {
  name: string;
  baseFret: number;
  frets: (number | "x")[];
  fingers: number[];
};

export const CHORD_DEFS_MARKER = "__CHORD_DEFS__";
