const SHARP_NOTES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
const FLAT_NOTES = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

export function transposeKey(key: string, semitones: number): string {
  const match = key.match(/^([A-G][#b]?)(.*)/);
  if (!match) return key;
  const [, root, suffix] = match;
  const scale = root.includes("b") ? FLAT_NOTES : SHARP_NOTES;
  let index = SHARP_NOTES.indexOf(root);
  if (index === -1) index = FLAT_NOTES.indexOf(root);
  if (index === -1) return key;
  return scale[(((index + semitones) % 12) + 12) % 12] + suffix;
}
