import { isMac } from "../../file";

const MOD = isMac() ? "⌘" : "Ctrl+";
const SHIFT = isMac() ? "⇧" : "Shift+";

const SHORTCUTS: [string, string][] = [
  ["/", "Insert a chord, heading, comment, or chord definition"],
  [`${MOD}] / ${MOD}[`, "Jump to next / previous chord"],
  ["Type while a chord is focused", "Rename it"],
  ["Arrow keys on a chord", "Nudge it by one character"],
  [`${SHIFT}Arrow on a chord`, "Nudge it to the next word boundary"],
  ["Backspace/Delete on a chord", "Delete it"],
  ["Escape on a chord", "Return to the lyric at that position"],
  [`${MOD}M`, "Focus song metadata"],
  [`${MOD}E`, "Toggle raw ChordPro source"],
  [`${MOD}K`, "Open this help"],
  [`${MOD}N / ${MOD}O`, "New / Open"],
  [`${MOD}S / ${MOD}${SHIFT}S`, "Save / Save As"],
];

export function KeyboardHelp({ onClose }: { onClose: () => void }) {
  return (
    <div className="keyboard-help-overlay" onClick={onClose}>
      <div
        className="keyboard-help"
        onClick={(event) => event.stopPropagation()}
      >
        <h2>Keyboard commands</h2>
        <dl>
          {SHORTCUTS.map(([keys, description]) => (
            <div className="shortcut-row" key={keys}>
              <dt>{keys}</dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
