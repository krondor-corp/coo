import type { ChordMark } from "@repo/core";
import { useEffect, useRef, useState } from "react";

type Props = {
  chord: ChordMark;
  focused: boolean;
  editing: boolean;
  /**
   * "absolute" anchors the chord above its character position in the lyric
   * text (the normal case). "flow" lays chords out left-to-right with even
   * spacing instead — used for chord-only lines (no real lyrics beneath
   * them, e.g. an instrumental intro), where character-position anchoring
   * packs chords too close together and their pills visually overlap.
   */
  layout: "absolute" | "flow";
  onRename: (name: string) => void;
  onDelete: () => void;
  onMove: (delta: number) => void;
  onMoveBoundary: (direction: 1 | -1) => void;
  onFocus: () => void;
  onEnterEdit: (initial?: string) => void;
  onExitEdit: () => void;
  onAdjacent: (direction: 1 | -1) => void;
  onEscape: () => void;
  onNavigateUp: () => void;
  onNavigateDown: () => void;
};

export function ChordToken({
  chord,
  focused,
  editing,
  layout,
  onRename,
  onDelete,
  onMove,
  onMoveBoundary,
  onFocus,
  onEnterEdit,
  onExitEdit,
  onAdjacent,
  onEscape,
  onNavigateUp,
  onNavigateDown,
}: Props) {
  const [draft, setDraft] = useState(chord.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (focused) {
      buttonRef.current?.focus();
    }
  }, [editing, focused]);

  useEffect(() => {
    if (!editing) setDraft(chord.name);
  }, [editing, chord.name]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={`chord-token chord-token-input${layout === "flow" ? " chord-token-flow" : ""}`}
        aria-label={`Rename chord ${chord.name}`}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          onRename(draft);
          onExitEdit();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onRename(draft);
            onExitEdit();
            onAdjacent(1);
          } else if (event.key === "Escape") {
            event.preventDefault();
            setDraft(chord.name);
            onExitEdit();
          } else if (event.key === "Tab") {
            event.preventDefault();
            onRename(draft);
            onExitEdit();
            onAdjacent(event.shiftKey ? -1 : 1);
          }
        }}
      />
    );
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`chord-token${focused ? " focused" : ""}${layout === "flow" ? " chord-token-flow" : ""}`}
      onFocus={onFocus}
      // Clicking selects rather than jumping straight into renaming — otherwise
      // the caret lands in a text input and Backspace edits the chord's name
      // instead of deleting the chord, leaving no way to remove one by mouse.
      // Type to rename, double-click to edit the name in place.
      onDoubleClick={() => onEnterEdit()}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onEnterEdit();
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          if (event.shiftKey) onMoveBoundary(-1);
          else onMove(-1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          if (event.shiftKey) onMoveBoundary(1);
          else onMove(1);
        } else if (event.key === "Backspace" || event.key === "Delete") {
          event.preventDefault();
          onDelete();
        } else if (event.key === "Escape") {
          event.preventDefault();
          onEscape();
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          onNavigateUp();
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          onNavigateDown();
        } else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
          event.preventDefault();
          onEnterEdit(event.key);
          setDraft(event.key);
        }
      }}
    >
      {chord.name}
    </button>
  );
}
