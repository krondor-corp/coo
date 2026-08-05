import type { ChordDefinition } from "@repo/core";
import { jsPDF } from "jspdf";
import { layoutChordRow, rowCount } from "./layout";
import type { PrintableSong } from "./types";

const MARGIN = 48; // 2/3 inch, in points
const PAGE = { width: 612, height: 792 }; // US Letter, portrait
const USABLE_WIDTH = PAGE.width - MARGIN * 2;
const PAGE_BOTTOM = PAGE.height - MARGIN;

/** Courier advances exactly 0.6em per character, which is what makes the grid work. */
const COURIER_ADVANCE = 0.6;
const BODY_SIZE_MAX = 10;
const BODY_SIZE_MIN = 6.5;

const GREY = 110;

// Fret diagram geometry, in points.
const STRING_SPACING = 8;
const FRET_SPACING = 9;
const DIAGRAM_MIN_FRETS = 4;
const DIAGRAM_LABEL_HEIGHT = 9;
const DIAGRAM_MARKER_HEIGHT = 7;
const DIAGRAM_GAP = 14;

function charWidth(size: number): number {
  return size * COURIER_ADVANCE;
}

/**
 * Shrinks the body font just enough that the longest line still fits the page.
 * Chord charts are unusable once lines wrap, so scaling down beats reflowing.
 */
function fitBodySize(song: PrintableSong): number {
  let longest = 0;
  for (const line of song.lines) {
    if (line.kind !== "lyric") continue;
    const lyricLength = line.chars.length;
    const chordExtent = line.chords.reduce(
      (max, chord) => Math.max(max, chord.position + chord.name.length + 1),
      0,
    );
    longest = Math.max(longest, lyricLength, chordExtent);
  }
  if (longest === 0) return BODY_SIZE_MAX;
  const ideal = USABLE_WIDTH / (longest * COURIER_ADVANCE);
  return Math.max(BODY_SIZE_MIN, Math.min(BODY_SIZE_MAX, ideal));
}

function diagramLayout(definition: ChordDefinition) {
  const strings = definition.frets.length;
  const numeric = definition.frets.filter(
    (fret): fret is number => typeof fret === "number" && fret > 0,
  );
  const lowest = numeric.length ? Math.min(...numeric) : 1;
  const highest = numeric.length ? Math.max(...numeric) : 0;
  const baseFret =
    highest - lowest < DIAGRAM_MIN_FRETS && definition.baseFret > 0
      ? definition.baseFret
      : lowest;
  const frets = Math.max(highest - baseFret + 1, DIAGRAM_MIN_FRETS);
  return {
    strings,
    baseFret,
    frets,
    gridWidth: (strings - 1) * STRING_SPACING,
    gridHeight: frets * FRET_SPACING,
  };
}

function diagramSize(definition: ChordDefinition) {
  const { gridWidth, gridHeight } = diagramLayout(definition);
  return {
    width: gridWidth + 12,
    height: gridHeight + DIAGRAM_LABEL_HEIGHT + DIAGRAM_MARKER_HEIGHT + 4,
  };
}

function drawDiagram(
  doc: jsPDF,
  definition: ChordDefinition,
  x: number,
  y: number,
) {
  const { strings, baseFret, frets, gridWidth, gridHeight } =
    diagramLayout(definition);

  doc.setFont("courier", "bold");
  doc.setFontSize(7);
  doc.setTextColor(0);
  doc.text(definition.name, x, y + 6);

  const gridTop = y + DIAGRAM_LABEL_HEIGHT + DIAGRAM_MARKER_HEIGHT;
  doc.setDrawColor(60);
  doc.setLineWidth(0.4);

  for (let row = 0; row <= frets; row++) {
    const lineY = gridTop + row * FRET_SPACING;
    doc.line(x, lineY, x + gridWidth, lineY);
  }
  for (let index = 0; index < strings; index++) {
    const lineX = x + index * STRING_SPACING;
    doc.line(lineX, gridTop, lineX, gridTop + gridHeight);
  }

  // A nut at the top when the shape is played open; otherwise label the fret.
  if (baseFret === 1) {
    doc.setLineWidth(1.4);
    doc.line(x, gridTop, x + gridWidth, gridTop);
    doc.setLineWidth(0.4);
  } else {
    doc.setFont("courier", "normal");
    doc.setFontSize(6);
    doc.setTextColor(GREY);
    doc.text(`${baseFret}`, x - 6, gridTop + FRET_SPACING - 2);
  }

  definition.frets.forEach((fret, index) => {
    const dotX = x + index * STRING_SPACING;
    if (fret === "x" || fret === -1) {
      doc.setFont("courier", "normal");
      doc.setFontSize(6);
      doc.setTextColor(0);
      doc.text("x", dotX - 1.5, gridTop - 2);
      return;
    }
    if (fret === 0) {
      doc.setDrawColor(0);
      doc.circle(dotX, gridTop - 4, 1.8, "S");
      return;
    }
    doc.setFillColor(0, 0, 0);
    doc.circle(
      dotX,
      gridTop + (fret - baseFret) * FRET_SPACING + FRET_SPACING / 2,
      2.2,
      "F",
    );
  });
}

const SECTION_LABELS: Record<string, string> = {
  verse: "Verse",
  chorus: "Chorus",
  bridge: "Bridge",
};

/** Renders the song to PDF bytes, ready to write to disk. */
export function renderSongPdf(song: PrintableSong): Uint8Array {
  const doc = new jsPDF({ unit: "pt", format: "letter", compress: true });
  const bodySize = fitBodySize(song);
  const cw = charWidth(bodySize);
  const lyricLineHeight = bodySize * 1.5;
  const chordRowHeight = bodySize * 1.25;

  let y = MARGIN;

  function ensureRoom(height: number) {
    if (y + height <= PAGE_BOTTOM) return;
    doc.addPage();
    y = MARGIN;
  }

  doc.setFont("times", "normal");
  doc.setFontSize(20);
  doc.setTextColor(0);
  doc.text(song.title, MARGIN, y + 16);
  y += 26;

  if (song.author) {
    doc.setFont("times", "italic");
    doc.setFontSize(11);
    doc.setTextColor(GREY);
    doc.text(song.author, MARGIN, y);
    y += 14;
  }

  if (song.captions.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(GREY);
    doc.text(song.captions.join("   ·   "), MARGIN, y);
    y += 12;
  }

  y += 10;

  for (let index = 0; index < song.lines.length; index++) {
    const line = song.lines[index];
    switch (line.kind) {
      case "lyric": {
        const text = line.chars.join("");
        const hasLyrics = text.trim().length > 0;
        const hasChords = line.chords.length > 0;

        // A line with neither words nor chords is a blank spacer.
        if (!hasLyrics && !hasChords) {
          y += lyricLineHeight * 0.6;
          break;
        }

        // Without lyrics underneath there's nothing to anchor to — an
        // instrumental bar has every chord at column 0, so they get flowed
        // left-to-right instead of stacked on the same spot.
        const placed = layoutChordRow(line.chords, {
          charWidth: cw,
          usableWidth: USABLE_WIDTH,
          anchored: hasLyrics,
        });
        const chordRows = rowCount(placed);

        ensureRoom(
          chordRows * chordRowHeight + (hasLyrics ? lyricLineHeight : 0),
        );

        if (chordRows > 0) {
          doc.setFont("courier", "bold");
          doc.setFontSize(bodySize);
          doc.setTextColor(0);
          for (const chord of placed) {
            doc.text(
              chord.name,
              MARGIN + chord.x,
              y + chord.row * chordRowHeight,
            );
          }
          y += chordRows * chordRowHeight;
        }

        if (hasLyrics) {
          doc.setFont("courier", "normal");
          doc.setFontSize(bodySize);
          doc.setTextColor(0);
          doc.text(text, MARGIN, y);
          y += lyricLineHeight;
        } else {
          y += lyricLineHeight * 0.4;
        }
        break;
      }

      case "heading": {
        // Only the opening of a section earns a label; its end just closes the block.
        if (line.boundary !== "start") {
          y += 6;
          break;
        }
        ensureRoom(24);
        y += 8;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(GREY);
        const label = SECTION_LABELS[line.section] ?? line.section;
        doc.text(label.toUpperCase(), MARGIN, y);
        y += 12;
        break;
      }

      case "comment": {
        if (!line.text.trim()) break;
        ensureRoom(18);
        y += 4;
        doc.setFont("times", "italic");
        doc.setFontSize(bodySize + 1);
        doc.setTextColor(GREY);
        doc.text(line.text, MARGIN, y);
        y += 14;
        break;
      }

      case "chorddef": {
        // Diagrams written one after another belong side by side, as in the
        // editor — one per line would waste most of the page.
        const run: ChordDefinition[] = [];
        while (song.lines[index]?.kind === "chorddef") {
          const current = song.lines[index];
          if (current.kind === "chorddef") run.push(current.definition);
          index++;
        }
        index--; // the for-loop's own increment consumes the next line

        const tallest = Math.max(...run.map((d) => diagramSize(d).height));
        ensureRoom(tallest + 10);
        let x = MARGIN;
        for (const definition of run) {
          const { width } = diagramSize(definition);
          if (x + width > MARGIN + USABLE_WIDTH) {
            y += tallest + 10;
            ensureRoom(tallest + 10);
            x = MARGIN;
          }
          drawDiagram(doc, definition, x, y);
          x += width + DIAGRAM_GAP;
        }
        y += tallest + 12;
        break;
      }

      default:
        // Directives Coo doesn't model are editing concerns, not chart content.
        break;
    }
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
