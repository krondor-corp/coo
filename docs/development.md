# Development

## structure

- `apps/desktop` — Tauri 2 + React desktop app
- `apps/site` — marketing/download site, deployed to [coo.krondor.org](https://coo.krondor.org)
- `packages/core` — ChordPro parsing, document model, editing commands, and rendering (framework-agnostic, no React/Tauri)
- `packages/design-tokens` — shared color/font CSS custom properties used by both apps
- `packages/typescript-config` — shared `tsconfig` bases

`apps/desktop` holds only the Tauri/React-specific layer — file I/O, keyboard wiring, components. Everything reusable (the document model, chord commands, ChordPro parsing) lives in `packages/core`, split by concern (`document/`, `commands/`, `chordDefinitions/`, `frontmatter/`, `song/`, `render/`, `transpose/`), each with its own `__tests__/`.

## run it

```bash
pnpm install
pnpm --filter desktop tauri dev
```

Frontend changes hot-reload; changes under `apps/desktop/src-tauri` need a restart.

## test / lint / typecheck

```bash
pnpm check                        # biome, whole workspace
pnpm types                        # tsc --noEmit, whole workspace
pnpm --filter @repo/core test      # document model, commands, parsing
pnpm --filter desktop test         # component tests (vitest + @testing-library/react)
```

Or everything at once via turbo:

```bash
pnpm turbo run check types test build
```

## build a local installer

```bash
pnpm --filter desktop tauri build
```

Bundles land in `apps/desktop/src-tauri/target/release/bundle/`.

## releasing

See [RELEASES.md](../RELEASES.md) for the full pipeline (release-please, tagging, the PAT it needs, and how to trigger a build manually).
