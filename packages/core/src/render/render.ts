import ChordSheetJS from "chordsheetjs";
import { CHORD_DEFS_MARKER, parseChordDefinitions } from "../chordDefinitions";
import type { RenderedSong, SplitHtml } from "./types";

export function renderChordPro(
  chordProBody: string,
  semitones = 0,
): RenderedSong {
  const { cleaned, chordDefinitions } = parseChordDefinitions(chordProBody);
  const parser = new ChordSheetJS.ChordProParser();
  const song = parser.parse(cleaned);
  const renderedSong = semitones === 0 ? song : song.transpose(semitones);
  const formatter = new ChordSheetJS.HtmlTableFormatter();
  return { html: formatter.format(renderedSong), chordDefinitions };
}

export function splitAtChordDefinitions(html: string): SplitHtml | null {
  const markerIndex = html.indexOf(CHORD_DEFS_MARKER);
  if (markerIndex === -1) return null;
  const beforeIndex = html.lastIndexOf('<div class="paragraph', markerIndex);
  const closeIndex = html.indexOf("</div>", markerIndex);
  if (beforeIndex === -1 || closeIndex === -1) return null;
  return {
    before: html.slice(0, beforeIndex),
    after: html.slice(closeIndex + "</div>".length),
  };
}
