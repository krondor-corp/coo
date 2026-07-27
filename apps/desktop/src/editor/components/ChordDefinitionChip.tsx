import type { ChordDefinition } from "@repo/core";
import { useState } from "react";

const STEP = 14;

function FretDiagram({ definition }: { definition: ChordDefinition }) {
  const width = definition.frets.length * STEP;
  const height = 44;
  return (
    <svg
      width={width}
      height={height}
      className="fret-diagram"
      aria-hidden="true"
    >
      {definition.frets.map((fret, i) => (
        <g key={`${definition.name}-${i}`}>
          <line
            x1={i * STEP + STEP / 2}
            y1={4}
            x2={i * STEP + STEP / 2}
            y2={height - 4}
            stroke="currentColor"
            strokeWidth={1}
          />
          {fret === "x" ? (
            <text
              x={i * STEP + STEP / 2}
              y={12}
              textAnchor="middle"
              fontSize={9}
            >
              ×
            </text>
          ) : fret > 0 ? (
            <circle
              cx={i * STEP + STEP / 2}
              cy={10 + fret * 8}
              r={4}
              fill="currentColor"
            />
          ) : null}
        </g>
      ))}
      {[0, 1, 2, 3].map((row) => (
        <line
          key={row}
          x1={STEP / 2}
          y1={10 + row * 8}
          x2={width - STEP / 2}
          y2={10 + row * 8}
          stroke="currentColor"
          strokeWidth={0.5}
        />
      ))}
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
