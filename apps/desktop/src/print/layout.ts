export type PlacedChord = {
  name: string;
  /** Offset from the left margin, in points. */
  x: number;
  /** Which stacked row of the chord line this sits on; 0 unless it wrapped. */
  row: number;
};

export type ChordRowOptions = {
  charWidth: number;
  usableWidth: number;
  /**
   * True when there are lyrics beneath to anchor to. False for an instrumental
   * bar, where every chord sits at or near column 0 and anchoring would pile
   * them all on the same spot.
   */
  anchored: boolean;
};

/** Chords flowed left-to-right are separated by this many character widths. */
const FLOW_GAP_CHARS = 2;

/**
 * Works out where each chord on a line is drawn.
 *
 * Anchored lines keep chords over their column, but never let one name start
 * before the previous one has finished — on paper there's no coloured pill to
 * tell two overlapping names apart, so a collision is just unreadable.
 */
export function layoutChordRow(
  chords: readonly { name: string; position: number }[],
  { charWidth, usableWidth, anchored }: ChordRowOptions,
): PlacedChord[] {
  const placed: PlacedChord[] = [];
  const gap = charWidth * (anchored ? 1 : FLOW_GAP_CHARS);

  let row = 0;
  let cursor = 0; // right edge of the last chord placed, in points

  for (const chord of chords) {
    const width = chord.name.length * charWidth;
    const desired = anchored ? chord.position * charWidth : cursor;
    let x =
      placed.length === 0 && anchored ? desired : Math.max(desired, cursor);

    // Wrap rather than run off the page. Anchored lines have already been
    // scaled to fit, so this is really only for flowed bars and pathological
    // chord names.
    if (x + width > usableWidth && placed.length > 0) {
      row++;
      x = 0;
    }

    placed.push({ name: chord.name, x, row });
    cursor = x + width + gap;
  }

  return placed;
}

/** How many stacked rows `layoutChordRow` used. */
export function rowCount(placed: readonly PlacedChord[]): number {
  return placed.length === 0 ? 0 : placed[placed.length - 1].row + 1;
}
