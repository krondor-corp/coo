import { isMac } from "../../file";

const MOD = isMac() ? "⌘" : "Ctrl+";
const SHIFT = isMac() ? "⇧" : "Shift+";

type Group = { title: string; shortcuts: [string, string][] };

const GROUPS: Group[] = [
  {
    title: "Writing",
    shortcuts: [
      ["/", "Add a chord, section, or note"],
      ["Enter", "Start a new line"],
      ["Backspace", "At the start of a line, join it to the one above"],
      [`${MOD}Z`, "Undo"],
      [`${MOD}${SHIFT}Z`, "Redo"],
    ],
  },
  {
    title: "Chords",
    shortcuts: [
      [`Tab / ${SHIFT}Tab`, "Go to the next / previous chord"],
      ["Click", "Select a chord (double-click to edit its name)"],
      ["Type", "Rename the selected chord"],
      ["← →", "Nudge it one letter"],
      [`${SHIFT}← →`, "Nudge it to the next word"],
      ["Backspace", "Remove it"],
      ["Escape", "Back to the lyrics"],
    ],
  },
  {
    title: "The song",
    shortcuts: [
      [`${MOD}M`, "Jump to the title"],
      [`${MOD}E`, "Show the plain text behind the song"],
    ],
  },
  {
    title: "Files",
    shortcuts: [
      [`${MOD}N / ${MOD}O`, "New / Open"],
      [`${MOD}S / ${MOD}${SHIFT}S`, "Save / Save a copy"],
      [`${MOD}K`, "Show or hide this list"],
    ],
  },
];

export function KeyboardHelp({ onClose }: { onClose: () => void }) {
  return (
    <div className="keyboard-help-overlay" onClick={onClose}>
      <div
        className="keyboard-help"
        onClick={(event) => event.stopPropagation()}
      >
        <h2>Shortcuts</h2>
        {GROUPS.map((group) => (
          <section className="shortcut-group" key={group.title}>
            <h3>{group.title}</h3>
            <dl>
              {group.shortcuts.map(([keys, description]) => (
                <div className="shortcut-row" key={keys}>
                  <dt>{keys}</dt>
                  <dd>{description}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
