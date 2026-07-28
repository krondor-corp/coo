# Commands

`⌘` is Cmd on macOS, `Ctrl` on Windows/Linux — Coo accepts either modifier everywhere regardless of platform detection, so both work on any system. In-app, every shortcut is shown with the real key for your machine (press `⌘K`/`Ctrl+K` for the reference).

## Writing

| Shortcut | Action |
| --- | --- |
| `/` (while writing lyrics) | Open the insert menu |
| Enter | Split the line at the caret |
| Backspace at column 0 | Merge into the line above |
| Arrow Up/Down | Move to the line above/below, same column |
| Arrow Left/Right at a line boundary | Move into the adjacent line |

## The insert menu (`/`)

| Action | Result |
| --- | --- |
| Insert chord | Chord at the caret — type a name, Enter |
| Insert verse heading | `{start_of_verse}` / `{end_of_verse}`, always blank |
| Insert chorus heading | Clones the first existing chorus, if any, instead of starting blank |
| Insert bridge heading | Same cloning behavior as chorus |
| Insert comment | `{comment: ...}`, editable inline |
| Define chord… | `{define: ...}` fretboard diagram, editable |

Arrow Up/Down move the highlight; Enter selects; typing filters the list.

## Chords

| Shortcut | Action |
| --- | --- |
| `⌘]` / `⌘[` | Jump to the next / previous chord in the document |
| Click a chord, or arrive via the above | Focus it |
| Type anything while focused | Rename it |
| Arrow Left/Right | Nudge one character |
| Shift+Arrow Left/Right | Jump to the next word boundary |
| Backspace/Delete | Delete it |
| Escape | Return focus to the lyric at that position |

## Metadata

| Shortcut | Action |
| --- | --- |
| `⌘M` | Focus the title field |
| Transpose `−`/`+` buttons | Shift the displayed chords by a semitone (view-only — see [file-format.md](./file-format.md#transpose)) |

Title, author, key, tempo, and tuning are dedicated fields. Everything else (capo, track, custom fields) is a chip, addable via "add a field: value…" and removable with its `×`.

## File

| Shortcut | Action |
| --- | --- |
| `⌘N` | New |
| `⌘O` | Open |
| `⌘S` | Save |
| `⌘⇧S` | Save As |
| `⌘E` | Toggle raw ChordPro source |
| `⌘K` | Toggle the keyboard help |
