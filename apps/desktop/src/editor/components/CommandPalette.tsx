import type { HeadingSection } from "@repo/core";
import { useState } from "react";

// Labels are short nouns so typing filters usefully — every item starting with
// "Insert" made the query match everything. The explanation rides alongside as a
// hint instead of inside the label, and isn't searched.
const ACTIONS = [
  { id: "chord", label: "Chord", hint: "above the word you're on" },
  { id: "verse", label: "Verse", hint: "a new, empty verse" },
  { id: "chorus", label: "Chorus", hint: "copies your first chorus" },
  { id: "bridge", label: "Bridge", hint: "copies your first bridge" },
  { id: "comment", label: "Comment", hint: "a note to yourself or the band" },
  { id: "chorddef", label: "Chord diagram", hint: "draw it on a fretboard" },
] as const;

type ActionId = (typeof ACTIONS)[number]["id"];

type Props = {
  onClose: () => void;
  onInsertChord: (name: string) => void;
  onInsertHeading: (section: HeadingSection) => void;
  onInsertComment: () => void;
  onDefineChord: (name: string) => void;
};

export function CommandPalette({
  onClose,
  onInsertChord,
  onInsertHeading,
  onInsertComment,
  onDefineChord,
}: Props) {
  const [query, setQuery] = useState("");
  const [naming, setNaming] = useState<"chord" | "chorddef" | null>(null);
  const [selected, setSelected] = useState(0);
  const filtered = ACTIONS.filter((action) =>
    action.label.toLowerCase().includes(query.toLowerCase()),
  );

  function updateQuery(value: string) {
    setQuery(value);
    setSelected(0);
  }

  function run(id: ActionId) {
    if (id === "verse" || id === "chorus" || id === "bridge") {
      onInsertHeading(id);
      onClose();
    } else if (id === "comment") {
      onInsertComment();
      onClose();
    } else {
      setNaming(id);
      setQuery("");
    }
  }

  if (naming) {
    return (
      <div className="command-palette-overlay" onClick={onClose}>
        <div
          className="command-palette"
          onClick={(event) => event.stopPropagation()}
        >
          <input
            autoFocus
            placeholder="Chord name (e.g. Fmaj7)…"
            aria-label="Chord name"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") onClose();
              else if (event.key === "Enter" && query.trim()) {
                if (naming === "chord") onInsertChord(query.trim());
                else onDefineChord(query.trim());
                onClose();
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div
        className="command-palette"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          placeholder="Insert…"
          aria-label="Command palette"
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              onClose();
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              if (filtered.length > 0)
                setSelected((i) => (i + 1) % filtered.length);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              if (filtered.length > 0) {
                setSelected((i) => (i - 1 + filtered.length) % filtered.length);
              }
            } else if (event.key === "Enter") {
              const action = filtered[selected] ?? filtered[0];
              if (action) run(action.id);
            }
          }}
        />
        <ul>
          {filtered.map((action, index) => (
            <li key={action.id}>
              <button
                type="button"
                className={index === selected ? "selected" : ""}
                onMouseEnter={() => setSelected(index)}
                onClick={() => run(action.id)}
              >
                <span className="palette-label">{action.label}</span>
                <span className="palette-hint">{action.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
