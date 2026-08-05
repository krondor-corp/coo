import type { LyricLine as LyricLineType } from "@repo/core";
import { useRef } from "react";
import type { Focus } from "../selection";
import { ChordToken } from "./ChordToken";

type Props = {
  line: LyricLineType;
  focus: Focus;
  onChangeText: (text: string) => void;
  onEnter: (caret: number) => void;
  onBackspaceAtStart: () => void;
  onCaretMove: (position: number) => void;
  onFocusLine: (position: number) => void;
  onNavigateUp: (position: number) => void;
  onNavigateDown: (position: number) => void;
  onNavigateLeft: () => void;
  onNavigateRight: () => void;
  onSlash: (position: number) => void;
  onGreaterThan: () => void;
  renameChord: (chordId: string, name: string) => void;
  deleteChord: (chordId: string) => void;
  moveChord: (chordId: string, delta: number) => void;
  moveChordToBoundary: (chordId: string, direction: 1 | -1) => void;
  focusChord: (chordId: string | null, editing?: boolean) => void;
  focusAdjacentChord: (chordId: string, direction: 1 | -1) => void;
  registerTextarea: (lineId: string, el: HTMLTextAreaElement | null) => void;
};

export function LyricLine({
  line,
  focus,
  onChangeText,
  onEnter,
  onBackspaceAtStart,
  onCaretMove,
  onFocusLine,
  onNavigateUp,
  onNavigateDown,
  onNavigateLeft,
  onNavigateRight,
  onSlash,
  onGreaterThan,
  renameChord,
  deleteChord,
  moveChord,
  moveChordToBoundary,
  focusChord,
  focusAdjacentChord,
  registerTextarea,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const text = line.chars.join("");
  const isChordOnly = text.trim().length === 0;

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const target = event.currentTarget;
    const atStart = target.selectionStart === 0 && target.selectionEnd === 0;
    const atEnd =
      target.selectionStart === text.length &&
      target.selectionEnd === text.length;

    if (event.key === "Enter") {
      event.preventDefault();
      onEnter(target.selectionStart);
    } else if (event.key === "Backspace" && atStart) {
      event.preventDefault();
      onBackspaceAtStart();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      onNavigateUp(target.selectionStart);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      onNavigateDown(target.selectionStart);
    } else if (event.key === "ArrowLeft" && atStart) {
      event.preventDefault();
      onNavigateLeft();
    } else if (event.key === "ArrowRight" && atEnd) {
      event.preventDefault();
      onNavigateRight();
    } else if (event.key === "/") {
      event.preventDefault();
      onSlash(target.selectionStart);
    } else if (event.key === ">" && atStart) {
      event.preventDefault();
      onGreaterThan();
    }
  }

  function handleCaret(event: React.SyntheticEvent<HTMLTextAreaElement>) {
    onCaretMove(event.currentTarget.selectionStart);
  }

  return (
    <div
      className={`lyric-row${isChordOnly ? " chord-only" : ""}`}
      data-line-id={line.id}
    >
      <div className={`chord-lane${isChordOnly ? " chord-lane-flow" : ""}`}>
        {line.chords.map((chord) => (
          // The anchor owns the positioning so that `ch` resolves against the
          // lyric text's font, not the chord pill's smaller one — otherwise every
          // chord drifts left in proportion to how far along the line it sits.
          <span
            key={chord.id}
            className={`chord-anchor${isChordOnly ? " chord-anchor-flow" : ""}`}
            style={isChordOnly ? undefined : { left: `${chord.position}ch` }}
          >
            <ChordToken
              chord={chord}
              layout={isChordOnly ? "flow" : "absolute"}
              focused={focus?.kind === "chord" && focus.chordId === chord.id}
              editing={
                focus?.kind === "chord" &&
                focus.chordId === chord.id &&
                focus.editing
              }
              onRename={(name) => renameChord(chord.id, name)}
              onDelete={() => deleteChord(chord.id)}
              onMove={(delta) => moveChord(chord.id, delta)}
              onMoveBoundary={(direction) =>
                moveChordToBoundary(chord.id, direction)
              }
              onFocus={() => focusChord(chord.id, false)}
              onEnterEdit={() => focusChord(chord.id, true)}
              onExitEdit={() => focusChord(chord.id, false)}
              onAdjacent={(direction) =>
                focusAdjacentChord(chord.id, direction)
              }
              onEscape={() => {
                focusChord(null);
                textareaRef.current?.focus();
                textareaRef.current?.setSelectionRange(
                  chord.position,
                  chord.position,
                );
              }}
              onNavigateUp={() => {
                focusChord(null);
                onNavigateUp(chord.position);
              }}
              onNavigateDown={() => {
                focusChord(null);
                onNavigateDown(chord.position);
              }}
            />
          </span>
        ))}
      </div>
      <textarea
        ref={(el) => {
          textareaRef.current = el;
          registerTextarea(line.id, el);
        }}
        className="lyric-input"
        aria-label="Lyric line"
        rows={1}
        spellCheck={false}
        value={text}
        onFocus={(event) => onFocusLine(event.currentTarget.selectionStart)}
        onChange={(event) => onChangeText(event.target.value)}
        onKeyDown={handleKeyDown}
        onSelect={handleCaret}
        onClick={handleCaret}
        onKeyUp={handleCaret}
      />
    </div>
  );
}
