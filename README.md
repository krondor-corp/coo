<p align="center">
  <img src="apps/site/public/logo.svg" width="72" height="72" alt="Coo logo">
</p>

# Coo

[![CI](https://github.com/krondor-corp/coo/actions/workflows/ci.yml/badge.svg)](https://github.com/krondor-corp/coo/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/krondor-corp/coo?filter=coo-v*&label=release&color=b5651d)](https://github.com/krondor-corp/coo/releases/latest)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-b5651d)](docs/install.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-b5651d)](https://opensource.org/licenses/MIT)
[![Site](https://img.shields.io/badge/site-coo.krondor.org-b5651d)](https://coo.krondor.org)

**A command-based ChordPro editor. Write lyrics naturally; insert, rename, and move chords without typing a single bracket.**

**[Visit the site](https://coo.krondor.org)** to download, or read the [quickstart](docs/quickstart.md) and [command reference](docs/commands.md).

## Features

- **Command-based chord entry** — `/` opens an insert menu for chords, section headings, comments, and chord diagrams; no `[Chord]` bracket syntax to type by hand
- **Keyboard-first editing** — jump between chords, nudge them by character or word, rename in place, all without the mouse
- **Plain ChordPro underneath** — every file is an ordinary `.chopro` file; open one from anywhere, and what Coo doesn't have a command for round-trips byte-for-byte
- **Non-destructive transpose** — shift the displayed chords by a semitone without touching the document or the saved file
- **Recovers from malformed files** — a parse error drops you into raw source with the error shown, and returns to the structured view the moment it's fixed

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/krondor-corp/coo/main/install.sh | bash
```

macOS and Linux only — see [docs/install.md](docs/install.md) for Windows, manual downloads, uninstalling, and **the Gatekeeper warning on macOS** (Coo isn't signed/notarized yet — this is expected, not a broken build).

## Quickstart

Open Coo, place your cursor in the lyrics, and press `/`:

```
/  → Insert chord → "Am" → Enter
```

That's it — no brackets. See [docs/quickstart.md](docs/quickstart.md) for the rest (headings, comments, chord diagrams, metadata, transpose) and [docs/commands.md](docs/commands.md) for the full keyboard reference. `⌘K` in the app opens the same reference. Common questions are in [docs/faq.md](docs/faq.md).

## Structure

- `apps/desktop` — Tauri 2 + React desktop app
- `apps/site` — marketing/download site, deployed to [coo.krondor.org](https://coo.krondor.org)
- `packages/core` — ChordPro parsing, document model, editing commands, and rendering (framework-agnostic)
- `packages/design-tokens` — shared color/font CSS custom properties
- `packages/typescript-config` — shared TypeScript configuration

## Development

```bash
pnpm install
pnpm --filter desktop tauri dev
```

```bash
pnpm check   # biome, whole workspace
pnpm types   # tsc --noEmit, whole workspace
pnpm turbo run test   # @repo/core + desktop test suites
```

See [docs/development.md](docs/development.md) for more, including building a local installer.

## File format

Coo reads and writes plain `.chopro` files — no proprietary format. See [docs/file-format.md](docs/file-format.md) for the frontmatter fields, which directives round-trip untouched, and how transpose works.

## Releases

Versioning is automated with [release-please](https://github.com/googleapis/release-please), tagging `coo-vX.Y.Z` on merge, which builds and publishes installers for macOS, Windows, and Linux. See [RELEASES.md](RELEASES.md) for the pipeline, the PAT it needs, and how to trigger a release manually.

## License

MIT
