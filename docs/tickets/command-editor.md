# Build Coo's Command-Based Chord Editor

## Context

Coo is a keyboard-first editor for writing ChordPro songs. The current implementation proves that we can parse a `.chopro` document and render an accurate song sheet, but it does not solve the actual product problem: authoring chord charts is slow and physically awkward.

Writing `[Am]some [F]lyrics` as source is tolerable. Revising it is not. Moving a chord by one syllable, changing its spelling, inserting a chord between existing chords, or navigating the chord sequence requires fiddly text edits that interrupt musical thought.

The product should feel like one cohesive editor, not a metadata form beside a source editor beside a preview. Raw source remains valuable as an escape hatch and debugging tool, but it is not the primary interaction model.

## Objective

Design and implement a single, command-based editor in which a musician can write lyrics naturally, add chords quickly, and make small chord-placement adjustments without manually editing ChordPro delimiters.

You have broad license to determine the UX. Explore the interaction model instead of treating the suggestions below as a required wireframe. The result should be coherent, learnable, and substantially faster than editing raw ChordPro in Vim.

## Core User Jobs

- Enter lyrics without syntax getting in the way.
- Insert a chord at the current lyric position with a short keyboard command.
- Select and rename a chord quickly.
- Move a chord left or right by small, predictable increments.
- Navigate between chords without reaching for the mouse.
- Add and edit song metadata without leaving the editor context.
- Understand how the document parses and recover from malformed source.
- Open and save ordinary `.chopro` files without lossy conversion.

## Interaction Questions To Resolve

- How are chords represented while editing: inline tokens, a lane above lyrics, anchored decorations, or another model?
- What invokes chord insertion: a shortcut, command palette, slash command, typing `[`, or a combination?
- What does left/right movement mean: character, grapheme, word/syllable boundary, or a modifier-dependent choice?
- How do keyboard users select the previous/next chord and move between lyric and chord editing?
- How are sections and directives created without exposing all source syntax?
- How does metadata live inline without becoming a settings form?
- How and when is raw source exposed?
- How are parse errors shown without replacing or disabling the editor?

Prototype these decisions and choose a consistent model. Do not mechanically reproduce the Pack screenshot; use it as inspiration for density, direct manipulation, calm typography, and a document-first interface.

## Required Behavior

- Coo opens and saves `.chopro` files.
- A save after structured editing produces valid, deterministic ChordPro.
- Opening and saving an untouched supported document does not change its content unexpectedly.
- Common metadata is directly editable in the document experience: title, key, tempo/BPM, capo, tuning, and tags.
- Chords can be inserted, renamed, deleted, navigated, and nudged using the keyboard.
- The parsed result is available in-context so authors can verify what Coo understands.
- Raw source is available as an explicit advanced/debugging mode.
- Unsupported directives and unknown frontmatter must be preserved, not silently discarded.
- Dirty state, New, Open, Save, Save As, and close confirmation continue to work.
- The interaction works with macOS and Windows keyboard conventions.

## Acceptance Scenarios

1. Starting from an empty document, write two lyric lines and add four chords without typing square brackets.
2. Move one existing chord several positions left and right without deleting and retyping it.
3. Rename a selected chord from `F` to `Fmaj7`, then jump directly to the next chord.
4. Change key and BPM inline, save, and confirm the corresponding frontmatter is valid.
5. Open an existing `.chopro` file containing an unknown metadata field and custom directive, edit lyrics, save, and confirm both unknown constructs survive.
6. Introduce malformed raw source, see a useful local error, repair it, and return to the structured editor without losing work.
7. Complete the primary writing flow using only the keyboard.

## Non-Goals

- A song library, cloud sync, collaboration, or remote storage integration.
- Meter, rhyme, harmonic, or song-structure analysis. Preserve room for these later, but do not implement them now.
- Inventing a Coo-specific file format. ChordPro capability is paramount for this phase.
- Performance-mode features such as audio playback, auto-scroll, QR sharing, or setlists.
- Pixel-matching the reference screenshot.

## Technical Constraints

- Keep the Tauri 2 shell and React/TypeScript frontend.
- Keep Rust limited to genuinely native boundaries.
- Build on `@repo/core` for parsing/rendering, but extend its document model or add an editor model where necessary.
- Do not make rendered HTML the editable source of truth.
- Model chord positions explicitly enough that movement and serialization are deterministic.
- Account for Unicode graphemes rather than assuming one JavaScript code unit equals one visible character.
- Add focused tests for parsing/serialization round trips and chord movement semantics.
- Keep the editor implementation decomposed enough that later inline analysis can attach annotations to stable document positions.

## Relevant Code

- `apps/desktop/src/App.tsx`: current minimal application shell and document lifecycle.
- `apps/desktop/src/styles.css`: current placeholder presentation.
- `packages/core/src/index.ts`: current frontmatter, ChordPro rendering, definitions, and transposition utilities.
- `apps/desktop/src-tauri/`: native shell and permissions.

## Deliverables

- Implement the chosen editor interaction model.
- Document the keyboard commands in-app and briefly in the README.
- Add unit tests for the editor document operations.
- Add at least one end-to-end or component-level test covering the primary acceptance scenario.
- Explain major UX choices and any deliberately deferred interactions in the pull request or a short design note.
