# File format

Coo reads and writes plain `.chopro` files — YAML-ish frontmatter, then a ChordPro body. There is no Coo-specific format; every file it produces opens in any ChordPro-compatible tool, and any ChordPro file opens in Coo.

```
---
title: Twinkle Twinkle
author: Traditional
key: C
tempo: 120
tuning: Standard
custom_field: whatever you want
---
{start_of_verse}
[C]Twinkle [G]twinkle [Am]little [F]star
{end_of_verse}
```

## frontmatter

`title`, `author`, `key`, `tempo`, and `tuning` get dedicated fields in the editor's header. Anything else in the frontmatter block — `capo`, `track`, or any name you make up — shows up as a removable chip and round-trips exactly; Coo never invents a schema for it.

## directives

Coo has first-class commands for the directives an author actually reaches for:

- `{start_of_verse}` / `{start_of_chorus}` / `{start_of_bridge}` and their `end_of_*` pairs
- `{comment: ...}`
- `{define: NAME base-fret N frets ... fingers ...}`

Any other directive — anything Coo doesn't have a specific command for — is preserved byte-for-byte and is only editable through raw source (`⌘E`). It is never dropped, reformatted, or guessed at.

## round-trip guarantee

Opening and saving a file you didn't touch produces the identical file. This holds down to the grapheme: Coo segments lyric text with `Intl.Segmenter`, not JS string indexing, so combining marks and multi-codepoint characters (emoji, etc.) don't get split or duplicated when a chord sits next to one.

## transpose

The `−`/`+` transpose control is a *view*, not an edit. It shifts every chord shown in the editor by a semitone and shows where you've landed next to the key (`→ D`), but:

- nothing is written to the document model
- nothing is written to the file on save
- the `key:` field is never rewritten automatically — it's what you declared, and transposing for a specific reading doesn't mean you're changing what key the song is actually in

If you want the transposition to be permanent, rename the chords directly (click each one, or delete and re-insert via `/`). A dedicated "commit transpose" edit mode is on the roadmap but doesn't exist yet — see [quickstart.md](./quickstart.md#transpose-without-touching-the-file).

## malformed files

A file with missing frontmatter, no title, or a non-numeric `tempo`/`capo` can't be parsed into the structured editor. Coo shows the parser's error and drops into raw source so you can fix it by hand; it re-parses on every keystroke and returns to the structured view the moment the file is valid again. Nothing is lost in between — raw source edits the same underlying text.
