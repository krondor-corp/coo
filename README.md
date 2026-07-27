# Coo

Coo is a keyboard-first desktop editor for writing ChordPro songs. It uses a Tauri 2 shell with a React and TypeScript frontend.

## Structure

- `apps/desktop` - Desktop application and Tauri shell
- `apps/site` - Marketing/download site, deployed to GitHub Pages at [krondor-corp.github.io/coo](https://krondor-corp.github.io/coo)
- `packages/core` - ChordPro parsing, document model, and rendering
- `packages/design-tokens` - Shared color/font CSS custom properties, used by both apps so they can't drift out of sync
- `packages/typescript-config` - Shared TypeScript configuration
- `docs/tickets/command-editor.md` - Product brief for the command-based editor

## Development

```bash
pnpm install
pnpm --filter desktop tauri dev
```

Workspace checks:

```bash
pnpm check
pnpm types
pnpm --filter @repo/core test
pnpm --filter desktop test
```

Build the desktop app for the current platform:

```bash
pnpm --filter desktop tauri build
```

## Keyboard commands

Coo is a command-based editor: lyrics are typed directly, and chords are inserted, moved, and renamed with the keyboard rather than by editing `[Chord]` brackets by hand. In-app, every shortcut is shown with the actual key for your system (`⌘` on macOS, `Ctrl` on Windows/Linux — both work everywhere regardless of platform detection); the table below shows both since this file isn't platform-aware. The full reference is also available in-app via `⌘K`/`Ctrl+K` or the help icon in the toolbar.

| Shortcut (macOS / Windows·Linux) | Action |
| --- | --- |
| `/` (while writing lyrics) | Open the insert menu: chord, verse/chorus/bridge heading, comment, or chord definition |
| `⌘]` / `⌘[` — `Ctrl+]` / `Ctrl+[` | Jump to the next / previous chord |
| Type while a chord is focused | Rename it |
| Arrow keys on a focused chord | Nudge it by one character |
| `⇧Arrow` — `Shift+Arrow` on a focused chord | Nudge it to the next word boundary |
| Backspace/Delete on a focused chord | Delete it |
| Escape on a focused chord | Return to the lyric at that position |
| `⌘M` — `Ctrl+M` | Focus song metadata (title, author, key, tempo, tuning, and any custom fields) |
| `⌘E` — `Ctrl+E` | Toggle raw ChordPro source |
| `⌘K` — `Ctrl+K` | Open the keyboard help |
| `⌘N` / `⌘O` — `Ctrl+N` / `Ctrl+O` | New / Open |
| `⌘S` / `⌘⇧S` — `Ctrl+S` / `Ctrl+Shift+S` | Save / Save As |

Repeating a chorus or bridge heading via the insert menu clones the first existing instance of that section rather than starting blank, since restating one from scratch is rarely the intent. Verses always start blank. Directives Coo doesn't have a dedicated command for are preserved verbatim and editable only via the raw source view (`⌘E`/`Ctrl+E`).

## Releases

Versioning is automated with [release-please](https://github.com/googleapis/release-please) (`.github/workflows/release-please.yml`), following the convention used across Krondor Corp repos (see `krondor-corp/confit`):

1. Commit to `main` using [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, etc.) — only commits touching `apps/desktop/**` affect the app's version.
2. release-please maintains a standing "chore(main): release coo X.Y.Z" PR, bumping the version across `apps/desktop/package.json`, `apps/desktop/src-tauri/tauri.conf.json`, and `apps/desktop/src-tauri/Cargo.toml` together, plus a changelog.
3. Merging that PR tags `coo-vX.Y.Z`, which triggers `.github/workflows/release-coo.yml`: it builds macOS, Windows, and Linux installers and attaches them to a GitHub Release with checksums.

**Repo secret required:** `RELEASE_PAT` — a classic PAT with `repo` scope. release-please runs as this token rather than the default `GITHUB_TOKEN` because GitHub blocks the default token's commits/tags from triggering other workflows — without a PAT, the tag it creates on merge wouldn't kick off `release-coo.yml`. Set it with:

```bash
gh secret set RELEASE_PAT --repo krondor-corp/coo
```

To release without waiting on release-please (e.g. a hotfix), trigger `release-coo.yml` directly:

```bash
gh workflow run release-coo.yml -f version=X.Y.Z
```
