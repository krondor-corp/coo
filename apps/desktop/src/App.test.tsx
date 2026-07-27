import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
  save: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
}));

/** Mod shortcuts dispatched with both modifiers set so the test doesn't depend on isMac() detection. */
function modKeyDown(key: string) {
  fireEvent.keyDown(window, { key, metaKey: true, ctrlKey: true });
}

function setCaret(textarea: HTMLTextAreaElement, position: number) {
  textarea.setSelectionRange(position, position);
  fireEvent.select(textarea);
}

function lyricLines(): HTMLTextAreaElement[] {
  return screen.getAllByLabelText("Lyric line") as HTMLTextAreaElement[];
}

/** Types "/" at `position`, which opens the insert menu with "Insert chord" as the default (first) action. */
async function insertChordAt(
  textarea: HTMLTextAreaElement,
  position: number,
  name: string,
) {
  setCaret(textarea, position);
  fireEvent.keyDown(textarea, { key: "/" });
  const paletteInput = await screen.findByLabelText("Command palette");
  fireEvent.keyDown(paletteInput, { key: "Enter" });
  const nameInput = await screen.findByLabelText("Chord name");
  fireEvent.change(nameInput, { target: { value: name } });
  fireEvent.keyDown(nameInput, { key: "Enter" });
  await waitFor(() => expect(screen.queryByLabelText("Chord name")).toBeNull());
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Acceptance scenario 1: write lyrics and insert chords without typing brackets", () => {
  it('writes two lyric lines and adds four chords using only the "/" insert menu', async () => {
    render(<App />);

    // The starter document ships with one chord already ([C] on the placeholder lyric).
    // Delete it via the keyboard first so the scenario genuinely starts from zero chords.
    const starterChord = screen.getByRole("button", { name: "C" });
    starterChord.focus();
    fireEvent.keyDown(starterChord, { key: "Backspace" });
    expect(document.querySelectorAll(".chord-token")).toHaveLength(0);

    const firstLine = lyricLines()[0];
    fireEvent.change(firstLine, { target: { value: "Twinkle twinkle" } });

    const lineAfterEdit = lyricLines()[0];
    const countBeforeSplit = lyricLines().length;
    setCaret(lineAfterEdit, "Twinkle twinkle".length);
    fireEvent.keyDown(lineAfterEdit, { key: "Enter" });

    // EMPTY_SOURCE's starter body ends with a trailing newline, so the document already
    // has a blank lyric line after the starter — splitting adds exactly one more line.
    await waitFor(() =>
      expect(lyricLines()).toHaveLength(countBeforeSplit + 1),
    );
    const secondLine = lyricLines()[1];
    fireEvent.change(secondLine, { target: { value: "little star" } });

    const line1 = lyricLines()[0];
    await insertChordAt(line1, 0, "C");
    await insertChordAt(line1, 8, "G");

    const line2 = lyricLines()[1];
    await insertChordAt(line2, 0, "Am");
    await insertChordAt(line2, 7, "F");

    const chordTokens = document.querySelectorAll(".chord-token");
    expect(Array.from(chordTokens).map((el) => el.textContent)).toEqual([
      "C",
      "G",
      "Am",
      "F",
    ]);

    // The author never typed "[" or "]" — confirm the brackets only exist in the derived
    // ChordPro serialization, not in anything that was typed into an input.
    for (const input of lyricLines()) {
      expect(input.value).not.toMatch(/[[\]]/);
    }

    modKeyDown("e");
    const rawSource = (await screen.findByLabelText(
      "ChordPro source",
    )) as HTMLTextAreaElement;
    expect(rawSource.value).toContain("[C]Twinkle [G]twinkle");
    expect(rawSource.value).toContain("[Am]little [F]star");
  });
});

describe("keyboard navigation between lines", () => {
  it("autofocuses the first lyric line on mount, with no click required", async () => {
    render(<App />);
    await waitFor(() => expect(document.activeElement).toBe(lyricLines()[0]));
  });

  it("moves focus to the new line after Enter, positioned at its start", async () => {
    render(<App />);
    const first = lyricLines()[0];
    fireEvent.change(first, { target: { value: "Hello world" } });
    const line = lyricLines()[0];
    setCaret(line, 5);
    fireEvent.keyDown(line, { key: "Enter" });

    await waitFor(() => {
      const active = document.activeElement as HTMLTextAreaElement;
      expect(active.value).toBe(" world");
      expect(active.selectionStart).toBe(0);
    });
  });

  it("moves focus to the end of the previous line after Backspace at column 0", async () => {
    render(<App />);
    const first = lyricLines()[0];
    fireEvent.change(first, { target: { value: "Hello world" } });
    const line = lyricLines()[0];
    setCaret(line, 5);
    fireEvent.keyDown(line, { key: "Enter" });

    await waitFor(() => expect(lyricLines().length).toBeGreaterThan(1));
    const second = lyricLines().find((el) => el.value === " world");
    if (!second) throw new Error("expected the split-off second line");
    setCaret(second, 0);
    fireEvent.keyDown(second, { key: "Backspace" });

    await waitFor(() => {
      const active = document.activeElement as HTMLTextAreaElement;
      expect(active.value).toBe("Hello world");
      expect(active.selectionStart).toBe(5);
    });
  });

  it("navigates up and down between lyric lines with the arrow keys", async () => {
    render(<App />);
    const first = lyricLines()[0];
    fireEvent.change(first, { target: { value: "one" } });
    setCaret(lyricLines()[0], 3);
    fireEvent.keyDown(lyricLines()[0], { key: "Enter" });
    await waitFor(() => expect(lyricLines().length).toBeGreaterThan(1));
    fireEvent.change(lyricLines()[1], { target: { value: "two" } });

    setCaret(lyricLines()[0], 1);
    fireEvent.keyDown(lyricLines()[0], { key: "ArrowDown" });
    await waitFor(() => expect(document.activeElement).toBe(lyricLines()[1]));

    fireEvent.keyDown(lyricLines()[1], { key: "ArrowUp" });
    await waitFor(() => expect(document.activeElement).toBe(lyricLines()[0]));
  });

  it("moves right at end-of-line into the start of the next line, and left at start-of-line to the end of the previous", async () => {
    render(<App />);
    const first = lyricLines()[0];
    fireEvent.change(first, { target: { value: "one" } });
    setCaret(lyricLines()[0], 3);
    fireEvent.keyDown(lyricLines()[0], { key: "Enter" });
    await waitFor(() => expect(lyricLines().length).toBeGreaterThan(1));
    fireEvent.change(lyricLines()[1], { target: { value: "two" } });

    setCaret(lyricLines()[0], 3);
    fireEvent.keyDown(lyricLines()[0], { key: "ArrowRight" });
    await waitFor(() => {
      const active = document.activeElement as HTMLTextAreaElement;
      expect(active).toBe(lyricLines()[1]);
      expect(active.selectionStart).toBe(0);
    });

    fireEvent.keyDown(lyricLines()[1], { key: "ArrowLeft" });
    await waitFor(() => {
      const active = document.activeElement as HTMLTextAreaElement;
      expect(active).toBe(lyricLines()[0]);
      expect(active.selectionStart).toBe(3);
    });
  });

  it("can insert a chord immediately after tabbing/focusing a line, with no prior click", async () => {
    render(<App />);
    const first = lyricLines()[0];
    fireEvent.change(first, { target: { value: "Hello" } });
    // Focus without any select/click event — matches a keyboard-only Tab into the field.
    const line = lyricLines()[0];
    line.focus();
    fireEvent.keyDown(line, { key: "/" });
    const paletteInput = await screen.findByLabelText("Command palette");
    fireEvent.keyDown(paletteInput, { key: "Enter" });
    const nameInput = await screen.findByLabelText("Chord name");
    fireEvent.change(nameInput, { target: { value: "C" } });
    fireEvent.keyDown(nameInput, { key: "Enter" });
    await waitFor(() => {
      expect(document.querySelector(".chord-token")?.textContent).toBe("C");
    });
  });

  it("navigates the / insert menu with arrow keys and selects the highlighted action", async () => {
    render(<App />);
    const line = lyricLines()[0];
    line.focus();
    fireEvent.keyDown(line, { key: "/" });
    const paletteInput = await screen.findByLabelText("Command palette");

    // Menu order: Insert chord, verse, chorus, bridge, comment, chorddef.
    // Five ArrowDowns land on "Insert comment", then one ArrowUp lands back on "bridge" —
    // exercises both directions before landing on comment for the assertion below.
    fireEvent.keyDown(paletteInput, { key: "ArrowDown" });
    fireEvent.keyDown(paletteInput, { key: "ArrowDown" });
    fireEvent.keyDown(paletteInput, { key: "ArrowDown" });
    fireEvent.keyDown(paletteInput, { key: "ArrowDown" });
    fireEvent.keyDown(paletteInput, { key: "ArrowDown" });
    fireEvent.keyDown(paletteInput, { key: "ArrowUp" });
    fireEvent.keyDown(paletteInput, { key: "Enter" });

    await waitFor(() => {
      expect(screen.queryByLabelText("Command palette")).toBeNull();
    });
    expect(document.querySelector(".comment-row")).not.toBeNull();
  });

  it("renders a chord definition chip after using Define chord…", async () => {
    render(<App />);
    const line = lyricLines()[0];
    line.focus();
    fireEvent.keyDown(line, { key: "/" });
    const paletteInput = await screen.findByLabelText("Command palette");
    fireEvent.change(paletteInput, { target: { value: "Define" } });
    fireEvent.keyDown(paletteInput, { key: "Enter" });
    const nameInput = await screen.findByLabelText("Chord name");
    fireEvent.change(nameInput, { target: { value: "Fmaj7" } });
    fireEvent.keyDown(nameInput, { key: "Enter" });

    await waitFor(() => {
      expect(document.querySelector(".chorddef-chip")).not.toBeNull();
    });
    expect(screen.getByLabelText("Chord definition for Fmaj7")).not.toBeNull();
    expect(document.querySelector(".chorddef-chip")?.textContent).toContain(
      "Fmaj7",
    );
  });

  it("editing a chord definition's frets via the popover persists the change", async () => {
    render(<App />);
    const line = lyricLines()[0];
    line.focus();
    fireEvent.keyDown(line, { key: "/" });
    const paletteInput = await screen.findByLabelText("Command palette");
    fireEvent.change(paletteInput, { target: { value: "Define" } });
    fireEvent.keyDown(paletteInput, { key: "Enter" });
    const nameInput = await screen.findByLabelText("Chord name");
    fireEvent.change(nameInput, { target: { value: "Fmaj7" } });
    fireEvent.keyDown(nameInput, { key: "Enter" });

    const chip = await screen.findByLabelText("Chord definition for Fmaj7");
    fireEvent.click(chip);

    const fretsInput = await screen.findByLabelText(
      "Frets (x = muted, 0 = open)",
    );
    const baseFretInput = await screen.findByLabelText("Base fret");
    fireEvent.change(baseFretInput, { target: { value: "3" } });
    fireEvent.change(fretsInput, { target: { value: "x 3 3 2 1 1" } });

    const saveButton = await screen.findByText("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.queryByLabelText("Base fret")).toBeNull();
    });

    fireEvent.click(chip);
    const reopenedFrets = await screen.findByLabelText(
      "Frets (x = muted, 0 = open)",
    );
    const reopenedBaseFret = await screen.findByLabelText("Base fret");
    expect((reopenedFrets as HTMLInputElement).value).toBe("x 3 3 2 1 1");
    expect((reopenedBaseFret as HTMLInputElement).value).toBe("3");
  });

  it("accepts frets typed without spaces, e.g. 032000", async () => {
    render(<App />);
    const line = lyricLines()[0];
    line.focus();
    fireEvent.keyDown(line, { key: "/" });
    const paletteInput = await screen.findByLabelText("Command palette");
    fireEvent.change(paletteInput, { target: { value: "Define" } });
    fireEvent.keyDown(paletteInput, { key: "Enter" });
    const nameInput = await screen.findByLabelText("Chord name");
    fireEvent.change(nameInput, { target: { value: "D" } });
    fireEvent.keyDown(nameInput, { key: "Enter" });

    const chip = await screen.findByLabelText("Chord definition for D");
    fireEvent.click(chip);

    const fretsInput = await screen.findByLabelText(
      "Frets (x = muted, 0 = open)",
    );
    fireEvent.change(fretsInput, { target: { value: "xx0232" } });
    fireEvent.click(await screen.findByText("Save"));

    await waitFor(() => {
      expect(screen.queryByLabelText("Base fret")).toBeNull();
    });

    const diagram = document.querySelector(".fret-diagram");
    expect(diagram?.getAttribute("width")).toBe(String(6 * 20));
    // Two "x" (muted) markers and one "o" (open string) marker.
    expect(diagram?.querySelectorAll("text").length).toBe(3);
    expect(diagram?.querySelectorAll("circle").length).toBe(3);
  });

  it("displays a high-fret chord (e.g. 13 12) with a fret-position label instead of clipping it off", async () => {
    render(<App />);
    const line = lyricLines()[0];
    line.focus();
    fireEvent.keyDown(line, { key: "/" });
    const paletteInput = await screen.findByLabelText("Command palette");
    fireEvent.change(paletteInput, { target: { value: "Define" } });
    fireEvent.keyDown(paletteInput, { key: "Enter" });
    const nameInput = await screen.findByLabelText("Chord name");
    fireEvent.change(nameInput, { target: { value: "F" } });
    fireEvent.keyDown(nameInput, { key: "Enter" });

    const chip = await screen.findByLabelText("Chord definition for F");
    fireEvent.click(chip);

    const fretsInput = await screen.findByLabelText(
      "Frets (x = muted, 0 = open)",
    );
    fireEvent.change(fretsInput, { target: { value: "13 12 0 0 x x" } });
    fireEvent.click(await screen.findByText("Save"));

    await waitFor(() => {
      expect(screen.queryByLabelText("Base fret")).toBeNull();
    });

    const diagram = document.querySelector(".fret-diagram");
    // A 4-row window starting at fret 10 comfortably covers frets 12 and 13.
    expect(diagram?.textContent).toContain("10fr");
    expect(diagram?.querySelectorAll("circle").length).toBe(2);

    const circles = Array.from(diagram?.querySelectorAll("circle") ?? []);
    for (const circle of circles) {
      const cy = Number(circle.getAttribute("cy"));
      const height = Number(diagram?.getAttribute("height"));
      expect(cy).toBeGreaterThan(0);
      expect(cy).toBeLessThan(height);
    }
  });
});

describe("transpose", () => {
  it("transposes chords and updates the written key field together", async () => {
    render(<App />);
    // Starter document ships in key C with a [C] chord on the placeholder lyric.
    expect((screen.getByLabelText("key") as HTMLInputElement).value).toBe("C");

    fireEvent.click(screen.getByLabelText("Transpose up a semitone"));

    await waitFor(() => {
      expect(document.querySelector(".chord-token")?.textContent).toBe("C#");
    });
    expect((screen.getByLabelText("key") as HTMLInputElement).value).toBe("C#");
  });

  it("persists the transposed chords and key to the saved file", async () => {
    render(<App />);

    fireEvent.click(screen.getByLabelText("Transpose up a semitone"));
    fireEvent.click(screen.getByLabelText("Transpose up a semitone"));

    await waitFor(() => {
      expect(document.querySelector(".chord-token")?.textContent).toBe("D");
    });

    vi.mocked(save).mockResolvedValue("/tmp/transpose-test.chopro");
    modKeyDown("s");
    await waitFor(() => expect(writeTextFile).toHaveBeenCalled());
    const [, savedContent] = vi.mocked(writeTextFile).mock.calls[0];
    expect(savedContent).toContain("[D]Start writing here");
    expect(savedContent).toContain("key: D");
  });
});

describe("keyboard help", () => {
  it("toggles open and closed with Mod+K", async () => {
    render(<App />);
    expect(screen.queryByText("Keyboard commands")).toBeNull();

    modKeyDown("k");
    await waitFor(() => {
      expect(screen.queryByText("Keyboard commands")).not.toBeNull();
    });

    modKeyDown("k");
    await waitFor(() => {
      expect(screen.queryByText("Keyboard commands")).toBeNull();
    });
  });
});

describe("comment lines", () => {
  it("moves focus to the next lyric line after pressing Enter in a comment", async () => {
    render(<App />);
    const first = lyricLines()[0];
    fireEvent.change(first, { target: { value: "one" } });
    setCaret(lyricLines()[0], 3);
    fireEvent.keyDown(lyricLines()[0], { key: "Enter" });
    await waitFor(() => expect(lyricLines().length).toBeGreaterThan(1));
    fireEvent.change(lyricLines()[1], { target: { value: "two" } });

    setCaret(lyricLines()[0], 0);
    fireEvent.keyDown(lyricLines()[0], { key: "/" });
    const paletteInput = await screen.findByLabelText("Command palette");
    fireEvent.change(paletteInput, { target: { value: "Insert comment" } });
    fireEvent.keyDown(paletteInput, { key: "Enter" });

    const commentInput = await screen.findByLabelText("Comment");
    fireEvent.change(commentInput, { target: { value: "sing louder" } });
    fireEvent.keyDown(commentInput, { key: "Enter" });

    await waitFor(() => {
      expect(document.activeElement).toBe(lyricLines()[1]);
    });
  });

  it("typing > at the start of a lyric line converts it into a comment, focused and ready to type", async () => {
    render(<App />);
    const line = lyricLines()[0];
    fireEvent.change(line, { target: { value: "sing louder here" } });
    setCaret(lyricLines()[0], 0);
    fireEvent.keyDown(lyricLines()[0], { key: ">" });

    await waitFor(() => {
      const commentInput = screen.getByLabelText("Comment") as HTMLInputElement;
      expect(commentInput.value).toBe("sing louder here");
      expect(document.activeElement).toBe(commentInput);
    });
    // The literal ">" was never typed into anything — it's the command, not text.
    expect(document.querySelector(".comment-input")).not.toBeNull();
  });
});

describe("deleting a chord definition line", () => {
  async function defineChordAtLine(line: HTMLTextAreaElement, name: string) {
    line.focus();
    fireEvent.keyDown(line, { key: "/" });
    const paletteInput = await screen.findByLabelText("Command palette");
    fireEvent.change(paletteInput, { target: { value: "Define" } });
    fireEvent.keyDown(paletteInput, { key: "Enter" });
    const nameInput = await screen.findByLabelText("Chord name");
    fireEvent.change(nameInput, { target: { value: name } });
    fireEvent.keyDown(nameInput, { key: "Enter" });
    return screen.findByLabelText(`Chord definition for ${name}`);
  }

  async function defineChord(name: string) {
    return defineChordAtLine(lyricLines()[0], name);
  }

  it("can be deleted via the Delete button in its popover", async () => {
    render(<App />);
    const chip = await defineChord("Funk");
    fireEvent.click(chip);
    const deleteButton = await screen.findByLabelText(
      "Delete chord definition for Funk",
    );
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(document.querySelector(".chorddef-chip")).toBeNull();
    });
  });

  it("can be deleted with Backspace at the start of the lyric line right after it", async () => {
    render(<App />);
    await defineChord("Funk");
    expect(document.querySelector(".chorddef-chip")).not.toBeNull();

    // The chorddef line was inserted right after the first lyric line, so it's
    // now the line right before whichever lyric line follows it.
    const lineAfterChorddef = lyricLines()[1];
    setCaret(lineAfterChorddef, 0);
    fireEvent.keyDown(lineAfterChorddef, { key: "Backspace" });

    await waitFor(() => {
      expect(document.querySelector(".chorddef-chip")).toBeNull();
    });
    // Focus should stay on the same (now-shifted) lyric line rather than jumping away.
    expect(document.activeElement).toBe(lineAfterChorddef);
  });

  it("lets you move the cursor below a chord definition that's the last line in the document", async () => {
    render(<App />);
    // Define the chord from the very last lyric line, so the chorddef line
    // ends up as the last line in the whole document with nothing below it.
    const lastLine = lyricLines()[lyricLines().length - 1];
    await defineChordAtLine(lastLine, "Funk");
    expect(document.querySelector(".chorddef-chip")).not.toBeNull();

    const countBefore = lyricLines().length;
    setCaret(lastLine, 0);
    fireEvent.keyDown(lastLine, { key: "ArrowDown" });

    await waitFor(() => {
      expect(lyricLines().length).toBe(countBefore + 1);
    });
    const newLine = lyricLines()[lyricLines().length - 1];
    expect(document.activeElement).toBe(newLine);
  });
});

describe("chord token arrow-key navigation", () => {
  it("moves focus down to the next lyric line from a focused chord token", async () => {
    render(<App />);
    const first = lyricLines()[0];
    fireEvent.change(first, { target: { value: "one" } });
    await insertChordAt(lyricLines()[0], 0, "G");
    setCaret(lyricLines()[0], "one".length);
    fireEvent.keyDown(lyricLines()[0], { key: "Enter" });
    await waitFor(() => expect(lyricLines().length).toBeGreaterThan(1));
    fireEvent.change(lyricLines()[1], { target: { value: "two" } });

    const chordButton = screen.getByRole("button", { name: "G" });
    chordButton.focus();
    fireEvent.keyDown(chordButton, { key: "ArrowDown" });

    await waitFor(() => {
      expect(document.activeElement).toBe(lyricLines()[1]);
    });
  });
});

describe("chord-only lines (e.g. an instrumental intro)", () => {
  it("lays chords out in a flowing row instead of overlapping when there's no lyric text to anchor to", async () => {
    render(<App />);
    // Clear the starter placeholder text and its chord — leaves a genuinely
    // empty lyric line, like an instrumental intro bar with no words.
    const starterChord = screen.getByRole("button", { name: "C" });
    starterChord.focus();
    fireEvent.keyDown(starterChord, { key: "Backspace" });
    fireEvent.change(lyricLines()[0], { target: { value: "" } });

    // No lyrics — just chords, like "[C]  [Am] [F] [G]" for an intro bar.
    await insertChordAt(lyricLines()[0], 0, "C");
    await insertChordAt(lyricLines()[0], 0, "Am");
    await insertChordAt(lyricLines()[0], 0, "F");
    await insertChordAt(lyricLines()[0], 0, "G");

    const lane = document.querySelector(".chord-lane");
    expect(lane?.classList.contains("chord-lane-flow")).toBe(true);

    const tokens = Array.from(document.querySelectorAll(".chord-token"));
    expect(tokens.length).toBe(4);
    for (const token of tokens) {
      // Flow layout doesn't anchor chords to a character position, so
      // there's no inline "left" pinning them into an overlapping stack.
      expect((token as HTMLElement).style.left).toBe("");
      expect(token.classList.contains("chord-token-flow")).toBe(true);
    }
  });

  it("uses absolute positioning above real lyric text instead", async () => {
    render(<App />);
    const line = lyricLines()[0];
    fireEvent.change(line, { target: { value: "hello world" } });
    await insertChordAt(lyricLines()[0], 0, "C");

    const lane = document.querySelector(".chord-lane");
    expect(lane?.classList.contains("chord-lane-flow")).toBe(false);
    const token = document.querySelector(".chord-token") as HTMLElement;
    expect(token.style.left).toBe("0ch");
  });
});

describe("Acceptance scenario 5: open, edit, save preserves unknown metadata and directives", () => {
  it("round trips unknown frontmatter and directives through open -> edit -> save", async () => {
    const source = [
      "---",
      "title: Existing Song",
      "custom_field: keep me",
      "---",
      "{unknown_directive: value}",
      "[Am]Hello there",
      "",
    ].join("\n");

    vi.mocked(open).mockResolvedValue("/tmp/song.chopro");
    vi.mocked(readTextFile).mockResolvedValue(source);

    render(<App />);

    fireEvent.click(screen.getByLabelText("Open"));
    await waitFor(() =>
      expect(readTextFile).toHaveBeenCalledWith("/tmp/song.chopro"),
    );

    await waitFor(() => {
      expect(lyricLines().length).toBeGreaterThan(0);
    });

    const lyricLine = lyricLines().find((el) =>
      el.value.includes("Hello there"),
    );
    if (!lyricLine)
      throw new Error("expected a lyric line containing 'Hello there'");
    fireEvent.change(lyricLine, { target: { value: "Hello world" } });

    modKeyDown("s");

    await waitFor(() => expect(writeTextFile).toHaveBeenCalled());
    const [savedPath, savedContent] = vi.mocked(writeTextFile).mock.calls[0];
    expect(savedPath).toBe("/tmp/song.chopro");
    expect(savedContent).toContain("custom_field: keep me");
    expect(savedContent).toContain("{unknown_directive: value}");
    expect(savedContent).toContain("[Am]Hello world");
  });
});
