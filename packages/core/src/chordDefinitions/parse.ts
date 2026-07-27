import { CHORD_DEFS_MARKER, type ChordDefinition } from "./types";

const DEFINE_RE =
  /^\{define:\s*(\S+)\s+(?:base-fret\s+(\d+)\s+)?frets\s+([-\d\sx]+?)(?:\s+fingers\s+([\d\s]+))?\s*\}$/i;

/** Extracts {define: ...} lines from a ChordPro body, replacing the first with a placeholder comment for rendering. */
export function parseChordDefinitions(body: string): {
  cleaned: string;
  chordDefinitions: ChordDefinition[];
} {
  const definitions: ChordDefinition[] = [];
  const output: string[] = [];
  let insertedPlaceholder = false;

  for (const line of body.replace(/\r\n?/g, "\n").split("\n")) {
    const match = line.trim().match(DEFINE_RE);
    if (!match) {
      output.push(line);
      continue;
    }

    const baseFret = match[2] ? Number(match[2]) : 1;
    definitions.push({
      name: match[1],
      baseFret: Math.max(baseFret, 1),
      frets: match[3]
        .trim()
        .split(/\s+/)
        .map((value) => (value.toLowerCase() === "x" ? "x" : Number(value))),
      fingers: match[4] ? match[4].trim().split(/\s+/).map(Number) : [],
    });
    if (!insertedPlaceholder) {
      output.push(`{comment: ${CHORD_DEFS_MARKER}}`);
      insertedPlaceholder = true;
    }
  }

  return { cleaned: output.join("\n"), chordDefinitions: definitions };
}
