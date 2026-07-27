import { readSongSource } from "@repo/core";
import { type Ref, useMemo, useState } from "react";

const DEDICATED_FIELDS = ["title", "author", "key", "tempo", "tuning"];

const COMMON_TUNINGS = [
  { name: "Standard", notes: "E A D G B E" },
  { name: "Drop D", notes: "D A D G B E" },
  { name: "Half Step Down", notes: "Eb Ab Db Gb Bb Eb" },
  { name: "Full Step Down", notes: "D G C F A D" },
  { name: "DADGAD", notes: "D A D G A D" },
  { name: "Open D", notes: "D A D F# A D" },
  { name: "Open G", notes: "D G D G B D" },
  { name: "Open C", notes: "C G C G C E" },
  { name: "Open E", notes: "E B E G# B E" },
];

function fieldWidth(value: string, placeholder: string): string {
  return `${Math.max(value.length, placeholder.length, 1) + 1}ch`;
}

type Props = {
  source: string;
  onChange: (field: string, value: string) => void;
  onTranspose: (semitones: number) => void;
  titleRef?: Ref<HTMLInputElement>;
};

export function MetadataBar({
  source,
  onChange,
  onTranspose,
  titleRef,
}: Props) {
  const metadata = useMemo(
    () => readSongSource(source)?.metadata ?? {},
    [source],
  );
  const fieldChips = Object.keys(metadata).filter(
    (key) => !DEDICATED_FIELDS.includes(key),
  );
  const [tuningOpen, setTuningOpen] = useState(false);

  function caption(name: string, placeholder: string) {
    const value = metadata[name] ?? "";
    return (
      <input
        key={name}
        className="song-caption-field"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        style={{ width: fieldWidth(value, placeholder) }}
        onChange={(event) => onChange(name, event.target.value)}
      />
    );
  }

  const tuningValue = metadata.tuning ?? "";

  return (
    <header className="song-header" aria-label="Song metadata">
      <input
        ref={titleRef}
        className="song-title"
        aria-label="Title"
        placeholder="Untitled"
        value={metadata.title ?? ""}
        onChange={(event) => onChange("title", event.target.value)}
      />
      <input
        className="song-author"
        aria-label="Author"
        placeholder="Add an author…"
        value={metadata.author ?? ""}
        onChange={(event) => onChange("author", event.target.value)}
      />
      <div className="song-caption">
        {caption("key", "key")}
        <div className="transpose-controls">
          <button
            type="button"
            aria-label="Transpose down a semitone"
            title="Transpose down a semitone"
            onClick={() => onTranspose(-1)}
          >
            −
          </button>
          <button
            type="button"
            aria-label="Transpose up a semitone"
            title="Transpose up a semitone"
            onClick={() => onTranspose(1)}
          >
            +
          </button>
        </div>
        <span className="song-caption-dot">·</span>
        {caption("tempo", "tempo")}
        <span className="song-caption-dot">·</span>
        <span className="tuning-field">
          <input
            className="song-caption-field"
            aria-label="tuning"
            placeholder="tuning"
            value={tuningValue}
            style={{ width: fieldWidth(tuningValue, "tuning") }}
            onChange={(event) => onChange("tuning", event.target.value)}
            onFocus={() => setTuningOpen(true)}
            onBlur={() => setTimeout(() => setTuningOpen(false), 150)}
          />
          {tuningOpen && (
            <ul className="tuning-options">
              {COMMON_TUNINGS.map((tuning) => (
                <li key={tuning.name}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onChange("tuning", tuning.name);
                      setTuningOpen(false);
                    }}
                  >
                    <span className="tuning-name">{tuning.name}</span>
                    <span className="tuning-notes">{tuning.notes}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </span>
      </div>
      {fieldChips.length > 0 && (
        <div className="song-tags">
          {fieldChips.map((name) => (
            <span className="tag-chip tag-chip-field" key={name}>
              <span className="tag-chip-label">{name}</span>
              <button
                type="button"
                aria-label={`Remove ${name}`}
                onClick={() => onChange(name, "")}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
