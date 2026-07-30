# The file format

Coo saves ordinary `.chopro` files — the song details at the top, the song itself underneath. There's no Coo-only format. Anything Coo saves opens in other ChordPro apps, and anything they save opens in Coo.

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

## the details at the top

`title`, `author`, `key`, `tempo`, and `tuning` get their own spots in the editor. Anything else — capo, what album it's from, or a name you invent — shows up as a tag you can remove, and comes back out of the file exactly as it went in. Coo doesn't insist on a particular set of fields.

## sections, notes, and chord shapes

Coo has buttons for the things you actually reach for while writing:

- verses, choruses, and bridges
- comments — notes to yourself or the band
- chord diagrams

Anything else a ChordPro file can contain is kept exactly as written, and you can edit it in the plain-text view (`⌘E`). It's never dropped, rewritten, or guessed at — so a song from another app survives a trip through Coo intact.

## opening and saving won't change your file

Open a song, save it without touching anything, and you get the identical file back. That holds for accented letters and emoji too — a chord sitting next to one won't split it or duplicate it.

## transpose

The `−`/`+` control is a view, not an edit. It shifts every chord on screen by a semitone and shows where you've landed next to the key (`→ D`), but:

- nothing is written to your file
- the `key:` field is never rewritten
- the song isn't marked as having unsaved changes

Printing (`⌘P`) follows the view, though — transpose for a singer, print, and you get the chart in the key you're playing while the file keeps the original.

That's deliberate. Transposing to suit a singer at rehearsal doesn't mean the song has changed key, so Coo doesn't rewrite what you wrote.

If you want the new key to stick, rename the chords yourself — click each one and type, or remove and re-add them with `/`. A "make this permanent" button is planned but doesn't exist yet. See [the quickstart](./quickstart.md#transpose-to-fit-a-voice).

## if a song won't open

A file with no title, or a tempo that isn't a number, can't be laid out as a song. Coo tells you what's wrong and switches to the plain-text view so you can fix it by hand. It rechecks as you type and returns to the normal view the moment the file makes sense. Nothing is lost in between — the plain-text view is editing the same song.
