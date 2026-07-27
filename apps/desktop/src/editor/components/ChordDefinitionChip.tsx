import type { ChordDefinition } from "@repo/core";
import { useState } from "react";

const STEP = 20;
const ROW_HEIGHT = 12;
const MIN_ROWS = 4;
const HEADER_HEIGHT = 14;
const BOTTOM_MARGIN = 6;
const LABEL_WIDTH = 22;

/**
 * Renders a fret-position window that always fits every fret in the chord —
 * chords voiced high up the neck (e.g. frets 12-13) auto-scroll the window
 * up and label its starting fret ("10fr"), rather than plotting dots past
 * a fixed 4-row canvas where they'd silently get clipped off.
 */
function FretDiagram({ definition }: { definition: ChordDefinition }) {
  const numericFrets = definition.frets.filter(
    (fret): fret is number => typeof fret === "number" && fret > 0,
  );
  const maxFret = numericFrets.length ? Math.max(...numericFrets) : MIN_ROWS;
  const minFret = numericFrets.length ? Math.min(...numericFrets) : 1;
  const rows = Math.max(MIN_ROWS, maxFret - minFret + 1);
  const windowStart = Math.max(1, Math.min(minFret, maxFret - rows + 1));
  const showLabel = windowStart > 1;
  const offsetX = showLabel ? LABEL_WIDTH : 0;

  const gridWidth = definition.frets.length * STEP;
  const width = gridWidth + offsetX;
  const gridTop = HEADER_HEIGHT;
  const height = gridTop + rows * ROW_HEIGHT + BOTTOM_MARGIN;

  return (
    <svg
      width={width}
      height={height}
      className="fret-diagram"
      aria-hidden="true"
    >
      {showLabel && (
        <text x={0} y={gridTop + ROW_HEIGHT} fontSize={10} fill="currentColor">
          {windowStart}fr
        </text>
      )}
      {definition.frets.map((fret, i) => {
        const x = offsetX + i * STEP + STEP / 2;
        return (
          <g key={`${definition.name}-${i}`}>
            <line
              x1={x}
              y1={gridTop}
              x2={x}
              y2={height - BOTTOM_MARGIN}
              stroke="currentColor"
              strokeWidth={1}
            />
            {fret === "x" ? (
              <text x={x} y={gridTop - 3} textAnchor="middle" fontSize={10}>
                ×
              </text>
            ) : fret === 0 ? (
              <text x={x} y={gridTop - 3} textAnchor="middle" fontSize={10}>
                o
              </text>
            ) : (
              <circle
                cx={x}
                cy={gridTop + (fret - windowStart + 1) * ROW_HEIGHT}
                r={5}
                fill="currentColor"
              />
            )}
          </g>
        );
      })}
      {Array.from({ length: rows + 1 }, (_, row) => {
        const y = gridTop + row * ROW_HEIGHT;
        return (
          <line
            key={`fret-line-${y}`}
            x1={offsetX + STEP / 2}
            y1={y}
            x2={width - STEP / 2}
            y2={y}
            stroke="currentColor"
            strokeWidth={row === 0 && !showLabel ? 1.5 : 0.5}
          />
        );
      })}
    </svg>
  );
}

type Props = {
  definition: ChordDefinition;
  onChange: (definition: ChordDefinition) => void;
  onDelete: () => void;
};

export function ChordDefinitionChip({ definition, onChange, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [fretsText, setFretsText] = useState(definition.frets.join(" "));
  const [baseFret, setBaseFret] = useState(String(definition.baseFret));

  function commit() {
    const trimmed = fretsText.trim();
    const tokens = /\s/.test(trimmed)
      ? trimmed.split(/\s+/)
      : trimmed.split("");
    const frets = tokens.map((value) =>
      value.toLowerCase() === "x" ? ("x" as const) : Number(value),
    );
    onChange({ ...definition, baseFret: Number(baseFret) || 1, frets });
    setOpen(false);
  }

  return (
    <div className="chorddef-row" data-chord={definition.name}>
      <button
        type="button"
        className="chorddef-chip"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Chord definition for ${definition.name}`}
      >
        <FretDiagram definition={definition} />
        <span>{definition.name}</span>
      </button>
      {open && (
        <div className="chorddef-popover">
          <label>
            Base fret
            <input
              value={baseFret}
              onChange={(event) => setBaseFret(event.target.value)}
            />
          </label>
          <label>
            Frets (x = muted, 0 = open)
            <input
              value={fretsText}
              onChange={(event) => setFretsText(event.target.value)}
            />
          </label>
          <div className="chorddef-popover-actions">
            <button type="button" onClick={commit}>
              Save
            </button>
            <button
              type="button"
              className="chorddef-delete"
              aria-label={`Delete chord definition for ${definition.name}`}
              onClick={onDelete}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
