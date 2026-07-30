import {
  type ChordDefinition,
  readSongSource,
  renderChordPro,
  splitAtChordDefinitions,
  transposeKey,
} from "@repo/core";
import { useMemo } from "react";

const STRING_SPACING = 12;
const FRET_SPACING = 14;
const PAD_LEFT = 16;
const PAD_TOP = 22;
const MIN_FRETS = 4;

/**
 * A print-only rendering of the song: no chrome, no editing affordances, and
 * shifted by whatever the view is currently transposed to — you print the key
 * you're actually playing in, not the one written in the file.
 */
type Props = {
  source: string;
  transposeOffset: number;
};

function diagramLayout(definition: ChordDefinition) {
  const strings = definition.frets.length;
  const numeric = definition.frets.filter(
    (fret): fret is number => typeof fret === "number" && fret > 0,
  );
  const lowest = numeric.length ? Math.min(...numeric) : 1;
  const highest = numeric.length ? Math.max(...numeric) : 0;
  const span = highest - lowest;
  const baseFret =
    span < MIN_FRETS && definition.baseFret > 0 ? definition.baseFret : lowest;
  const frets = Math.max(highest - baseFret + 1, MIN_FRETS);
  return {
    strings,
    baseFret,
    frets,
    gridWidth: (strings - 1) * STRING_SPACING,
    gridHeight: frets * FRET_SPACING,
  };
}

function FretDiagram({ definition }: { definition: ChordDefinition }) {
  const { strings, baseFret, frets, gridWidth, gridHeight } =
    diagramLayout(definition);
  const width = gridWidth + PAD_LEFT + 8;
  const height = gridHeight + PAD_TOP + 10;

  return (
    <div className="print-diagram">
      <span className="print-diagram-name">{definition.name}</span>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {baseFret === 1 ? (
          <rect
            x={PAD_LEFT}
            y={PAD_TOP - 2}
            width={gridWidth}
            height={2.5}
            fill="currentColor"
          />
        ) : (
          <text
            x={PAD_LEFT - 4}
            y={PAD_TOP + FRET_SPACING / 2 + 3}
            textAnchor="end"
            fontSize={8}
            fill="currentColor"
          >
            {baseFret}
          </text>
        )}
        {Array.from(
          { length: frets + 1 },
          (_, row) => PAD_TOP + row * FRET_SPACING,
        ).map((y) => (
          <line
            key={`fret-line-${y}`}
            x1={PAD_LEFT}
            y1={y}
            x2={PAD_LEFT + gridWidth}
            y2={y}
            stroke="currentColor"
            strokeWidth={0.5}
          />
        ))}
        {Array.from(
          { length: strings },
          (_, index) => PAD_LEFT + index * STRING_SPACING,
        ).map((x) => (
          <line
            key={`string-line-${x}`}
            x1={x}
            y1={PAD_TOP}
            x2={x}
            y2={PAD_TOP + gridHeight}
            stroke="currentColor"
            strokeWidth={0.5}
          />
        ))}
        {definition.frets.map((fret, index) => {
          const x = PAD_LEFT + index * STRING_SPACING;
          const key = `${definition.name}-dot-${index}`;
          if (fret === "x" || fret === -1) {
            return (
              <text
                key={key}
                x={x}
                y={PAD_TOP - 6}
                textAnchor="middle"
                fontSize={8}
                fill="currentColor"
              >
                x
              </text>
            );
          }
          if (fret === 0) {
            return (
              <circle
                key={key}
                cx={x}
                cy={PAD_TOP - 7}
                r={3}
                fill="none"
                stroke="currentColor"
                strokeWidth={0.8}
              />
            );
          }
          return (
            <circle
              key={key}
              cx={x}
              cy={PAD_TOP + (fret - baseFret) * FRET_SPACING + FRET_SPACING / 2}
              r={4}
              fill="currentColor"
            />
          );
        })}
      </svg>
    </div>
  );
}

export function PrintSheet({ source, transposeOffset }: Props) {
  const song = useMemo(() => {
    const parsed = readSongSource(source);
    if (!parsed) return null;
    const { html, chordDefinitions } = renderChordPro(
      parsed.body,
      transposeOffset,
    );
    return { metadata: parsed.metadata, html, chordDefinitions };
  }, [source, transposeOffset]);

  if (!song) return null;

  const { metadata, html, chordDefinitions } = song;
  const key =
    metadata.key && transposeOffset !== 0
      ? transposeKey(metadata.key, transposeOffset)
      : metadata.key;

  const captions = [
    key && `key: ${key}`,
    metadata.tempo && `${metadata.tempo} bpm`,
    metadata.tuning && `tuning: ${metadata.tuning}`,
    metadata.capo && `capo ${metadata.capo}`,
  ].filter(Boolean) as string[];

  // Chord diagrams belong where the author put them, so the rendered song is
  // split at the marker renderChordPro leaves behind and they're dropped in.
  const split = chordDefinitions.length ? splitAtChordDefinitions(html) : null;

  return (
    <div className="print-sheet" aria-hidden="true">
      <h1>{metadata.title ?? "Untitled"}</h1>
      {metadata.author && <p className="print-author">{metadata.author}</p>}
      {captions.length > 0 && (
        <p className="print-meta">{captions.join(" · ")}</p>
      )}
      {split ? (
        <div className="song-sheet">
          <div dangerouslySetInnerHTML={{ __html: split.before }} />
          <div className="print-diagrams">
            {chordDefinitions.map((definition, index) => (
              <FretDiagram
                key={`${definition.name}-${index}`}
                definition={definition}
              />
            ))}
          </div>
          <div dangerouslySetInnerHTML={{ __html: split.after }} />
        </div>
      ) : (
        <>
          {chordDefinitions.length > 0 && (
            <div className="print-diagrams">
              {chordDefinitions.map((definition, index) => (
                <FretDiagram
                  key={`${definition.name}-${index}`}
                  definition={definition}
                />
              ))}
            </div>
          )}
          <div
            className="song-sheet"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </>
      )}
    </div>
  );
}
