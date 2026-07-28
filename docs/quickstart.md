# Quickstart

Coo opens with a starter song already in place — a title, a key, a tempo, and one line of lyrics with a chord on it. Everything below works from there.

## write lyrics

Click a lyric line and type. Press **Enter** to start a new line, **Backspace** at the start of a line to join it to the one above.

## add a chord

Put your cursor where the chord should sit and press **`/`**. Choose **Insert chord**, type a name (`Am`, `Fmaj7`, `G/B` — anything), and press Enter. No brackets involved.

```
/  → Insert chord → "Am" → Enter
```

## move a chord

Click a chord to select it, or press **Tab** to jump from chord to chord (**⇧Tab** to go back). Then:

- **Arrow keys** — nudge it one letter left or right
- **Shift+Arrow** — jump to the next word
- **Backspace/Delete** — remove it
- **Type anything** — rename it on the spot
- **Escape** — go back to the lyrics

## add a section, note, or chord diagram

Same `/` menu:

```
/  → Insert chorus heading      (copies your first chorus, if you have one)
/  → Insert comment             (a note to yourself or the band)
/  → Define chord…              (a fretboard diagram you can draw)
```

## fill in the song details

`⌘M` jumps to the title. Key, tempo, and tuning sit on the line beneath it. Anything else you want to note — capo, tuning notes, who to credit, whatever you like — type `name: value` in the "add a field" box and it becomes a tag you can remove later.

## transpose to fit a voice

The `−`/`+` buttons next to the key shift every chord on screen and show where you've landed (`→ D`). This only changes what you're looking at. Your file keeps the chords and the key you actually wrote — so transposing on the fly for a singer never rewrites the song. See [the file format](./file-format.md#transpose).

## save

`⌘S` saves, `⌘⇧S` saves a copy somewhere new. `⌘N` starts a new song, `⌘O` opens an existing one.

## if a song won't open

If the details at the top of the file are off — no title, or a tempo that isn't a number — Coo tells you what's wrong and switches to the plain-text view so you can fix it yourself. It checks as you type and slips back to the normal view the moment the song makes sense again. You can switch to plain text any time with `⌘E`.

See [the full list of shortcuts](./commands.md), or press `⌘K` in the app.
