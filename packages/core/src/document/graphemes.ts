const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export function toGraphemes(text: string): string[] {
  return Array.from(segmenter.segment(text), (entry) => entry.segment);
}
