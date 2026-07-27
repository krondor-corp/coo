/** What currently has editing focus in the structured document view. */
export type Focus =
  | { kind: "lyric"; lineId: string }
  | { kind: "chord"; chordId: string; editing: boolean }
  | { kind: "comment"; lineId: string }
  | { kind: "metadata"; field: string }
  | null;
