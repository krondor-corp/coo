import type { ChordDefinition } from "./types";

export function formatChordDefinition(definition: ChordDefinition): string {
  const frets = definition.frets
    .map((fret) => (fret === "x" ? "x" : String(fret)))
    .join(" ");
  let out = `{define: ${definition.name} base-fret ${definition.baseFret} frets ${frets}`;
  if (definition.fingers.length > 0)
    out += ` fingers ${definition.fingers.join(" ")}`;
  return `${out}}`;
}
