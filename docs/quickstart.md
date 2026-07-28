# Quickstart

Coo opens with a starter document already in place — a title, a key, a tempo, and one lyric line with a chord on it. Everything below works from there.

## write lyrics

Click (or tab into) a lyric line and type. Press **Enter** to start a new line, **Backspace** at the start of a line to merge it into the one above.

## insert a chord

Place your cursor where the chord should sit and press **`/`**. Pick **Insert chord**, type a name (`Am`, `Fmaj7`, `G/B` — anything), and press Enter. No `[` or `]` involved.

```
/  → Insert chord → "Am" → Enter
```

## move a chord

Click a chord (or jump to it with `⌘]` / `⌘[`) to focus it, then:

- **Arrow keys** — nudge it one character
- **Shift+Arrow** — jump to the next word boundary
- **Backspace/Delete** — remove it
- **Type anything** — renames it in place
- **Escape** — back to the lyric at that position

## add a heading, comment, or chord diagram

Same `/` menu:

```
/  → Insert chorus heading      (clones the first chorus if one exists)
/  → Insert comment
/  → Define chord…              (fretboard diagram, editable)
```

## edit song metadata

`⌘M` focuses the title. Key, tempo, and tuning live in the caption line beneath it; anything else (capo, track, arbitrary fields) is a removable chip — type `field: value` in the "add a field" box to create one.

## transpose without touching the file

The `−`/`+` buttons next to the key shift every chord shown in the editor and display where you've landed (`→ D`), but nothing is written to the document or the saved file until you edit a chord directly. This is a view, not an edit — see [file-format.md](./file-format.md#transpose) for why.

## save

`⌘S` saves in place, `⌘⇧S` always prompts for a location. `⌘N`/`⌘O` for New/Open.

## when something doesn't parse

Malformed frontmatter (a missing title, a non-numeric tempo) drops you into raw source automatically with the parser's error on screen. Fix the text and Coo returns to the structured view once it parses again. You can also switch to raw mode any time with `⌘E`.

See [commands.md](./commands.md) for the full shortcut reference, or press `⌘K` in the app.
