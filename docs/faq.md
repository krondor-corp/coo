# FAQ

## How do I open or save a file?

`⌘O` opens, `⌘N` starts a new document, `⌘S` saves in place, `⌘⇧S` always prompts for a location — same as the toolbar buttons. Files are plain `.chopro` text; there's no import/export step.

## What metadata does Coo support?

Five dedicated fields with their own UI: `title`, `author`, `key`, `tempo`, `tuning`. Everything else — `capo`, `track`, or any name you make up — is a removable chip, addable by typing `field: value` in the "add a field" box. There's no fixed schema underneath; frontmatter is a plain `key: value` map, so Coo never discards a field it doesn't specifically know about. See [file-format.md](./file-format.md#frontmatter).

## Can I use these files in another editor?

Yes. Coo reads and writes ordinary ChordPro — no proprietary format, no lossy round-trip. A file saved from Coo opens in any ChordPro-compatible tool, and a file from any other ChordPro tool opens in Coo. Directives Coo doesn't have a specific command for (anything beyond headings, comments, and chord definitions) are preserved verbatim rather than dropped. See [file-format.md](./file-format.md).

## Why does macOS say Coo is from an unidentified developer?

It isn't signed with an Apple Developer ID or notarized yet — that's expected, not a broken build. See [install.md](./install.md#macos-apple-could-not-verify-this-app-is-free-of-malware) for the one-time bypass.

## Does transposing change my file?

No. The `−`/`+` transpose buttons only change what's displayed — the document and the saved file keep the original chords and the `key:` field you wrote. See [file-format.md](./file-format.md#transpose).

## What happens if I open a file that doesn't parse?

Coo shows the parser's error (missing title, non-numeric tempo, etc.) and drops into raw source so you can fix the text directly. It re-parses on every keystroke and returns to the structured view the moment the file is valid — nothing is lost in between.

## Is there a mobile version?

No. Coo is a desktop app (Tauri) for macOS, Windows, and Linux.
