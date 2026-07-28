import { readSongSource, transposeKey } from "@repo/core";
import type {
  ChordDefinition,
  EditorDocument,
  HeadingSection,
} from "@repo/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { CircleHelp, FilePlus2, FolderOpen, Save, SaveAll } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChordDefinitionChip,
  CommandPalette,
  CommentLine,
  HeadingLine,
  KeyboardHelp,
  LyricLine,
  MetadataBar,
  PassthroughLine,
  RawSourceView,
  adjacentLyricLine,
  convertLyricToComment,
  deleteChord,
  deleteLine,
  insertBlankLyricLineAfter,
  insertChordAt,
  insertComment,
  insertHeadingBlock,
  listChords,
  mergeLineUp,
  moveChord,
  moveChordToBoundary,
  renameChord,
  setLyricText,
  splitLine,
  transposeDocument,
  updateComment,
  upsertChordDefinition,
  useEditorState,
} from "./editor";
import {
  fileNameFromPath,
  isDirty,
  isMac,
  matchesMod,
  openFile,
  saveFile,
  saveFileAs,
} from "./file";

const EMPTY_SOURCE = `---
title: Untitled
key: C
tempo: 120
---
[C]Start writing here
`;

const MOD = isMac() ? "⌘" : "Ctrl+";
const SHIFT = isMac() ? "⇧" : "Shift+";

type ConfirmRequest = { message: string; resolve: (ok: boolean) => void };

export function App() {
  const {
    source,
    document,
    parseError,
    rawMode,
    setRawMode,
    focus,
    setFocus,
    activeCaret,
    setActiveCaret,
    loadSource,
    editRawSource,
    applyDocument,
    updateMetadata,
    makeId,
  } = useEditorState(EMPTY_SOURCE);

  const [path, setPath] = useState<string | null>(null);
  const [savedSource, setSavedSource] = useState(EMPTY_SOURCE);
  const [status, setStatus] = useState("Ready");
  const [showPalette, setShowPalette] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(
    null,
  );
  /** A line to focus (and a caret position within it) once the next render commits. */
  const [pendingFocus, setPendingFocus] = useState<{
    lineId: string;
    position: number;
  } | null>(null);

  const titleFieldRef = useRef<HTMLInputElement>(null);
  const sourceRef = useRef(source);
  const savedSourceRef = useRef(savedSource);
  const documentRef = useRef(document);
  const focusRef = useRef(focus);
  const activeCaretRef = useRef(activeCaret);
  const textareaRefs = useRef(new Map<string, HTMLTextAreaElement>());
  sourceRef.current = source;
  savedSourceRef.current = savedSource;
  documentRef.current = document;
  focusRef.current = focus;
  activeCaretRef.current = activeCaret;

  const registerTextarea = useCallback(
    (lineId: string, el: HTMLTextAreaElement | null) => {
      if (el) textareaRefs.current.set(lineId, el);
      else textareaRefs.current.delete(lineId);
    },
    [],
  );

  const dirty = isDirty(source, savedSource);

  // Applies `pendingFocus` once the target textarea exists in the DOM (after a render commit
  // from split/merge/navigate/load), then clears it. Imperative DOM focus is unavoidable here:
  // each lyric line is its own <textarea>, so "continue typing on the new line" only works if
  // we explicitly move focus there ourselves.
  useEffect(() => {
    if (!pendingFocus) return;
    const el = textareaRefs.current.get(pendingFocus.lineId);
    if (el) {
      el.focus();
      const position = Math.min(pendingFocus.position, el.value.length);
      el.setSelectionRange(position, position);
      setActiveCaret({ lineId: pendingFocus.lineId, position });
    }
    setPendingFocus(null);
  }, [pendingFocus, setActiveCaret]);

  // Autofocus the first lyric line on initial mount, so keyboard-only use works immediately.
  useEffect(() => {
    const first = documentRef.current?.lines.find(
      (line) => line.kind === "lyric",
    );
    if (first) setPendingFocus({ lineId: first.id, position: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // New/Open set this before the document updates; once it lands, refocus the first lyric line.
  const justLoadedRef = useRef(false);
  useEffect(() => {
    if (!justLoadedRef.current) return;
    justLoadedRef.current = false;
    const first = document?.lines.find((line) => line.kind === "lyric");
    if (first) setPendingFocus({ lineId: first.id, position: 0 });
  }, [document]);

  const confirmDiscard = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => setConfirmRequest({ message, resolve }));
  }, []);

  const withDocument = useCallback(
    (fn: (doc: EditorDocument) => EditorDocument) => {
      if (!documentRef.current) return;
      applyDocument(fn(documentRef.current));
    },
    [applyDocument],
  );

  function focusChord(chordId: string | null, editing = false) {
    setFocus(chordId ? { kind: "chord", chordId, editing } : null);
  }

  function focusAdjacentChord(chordId: string, direction: 1 | -1) {
    const doc = documentRef.current;
    if (!doc) return;
    const chords = listChords(doc);
    const index = chords.findIndex((c) => c.chord.id === chordId);
    if (index === -1) return;
    const next = chords[(index + direction + chords.length) % chords.length];
    if (next)
      setFocus({ kind: "chord", chordId: next.chord.id, editing: false });
  }

  function navigateChords(direction: 1 | -1) {
    const doc = documentRef.current;
    if (!doc) return;
    const chords = listChords(doc);
    if (chords.length === 0) return;
    if (focusRef.current?.kind === "chord") {
      focusAdjacentChord(focusRef.current.chordId, direction);
      return;
    }
    const target = direction === 1 ? chords[0] : chords[chords.length - 1];
    setFocus({ kind: "chord", chordId: target.chord.id, editing: false });
  }

  function navigateVertical(
    lineId: string,
    position: number,
    direction: 1 | -1,
  ) {
    const doc = documentRef.current;
    if (!doc) return;
    const target = adjacentLyricLine(doc, lineId, direction);
    if (target) {
      setPendingFocus({
        lineId: target.id,
        position: Math.min(position, target.chars.length),
      });
      return;
    }
    // Nowhere to go down to, but the document doesn't end here (it ends in a
    // trailing chord definition, heading, or comment) — add a lyric line
    // after everything so there's somewhere to keep writing.
    const lastLine = doc.lines[doc.lines.length - 1];
    if (direction === 1 && lastLine && lastLine.id !== lineId) {
      const next = insertBlankLyricLineAfter(doc, lastLine.id, makeId);
      applyDocument(next);
      const newLine = next.lines[next.lines.length - 1];
      setPendingFocus({ lineId: newLine.id, position: 0 });
    }
  }

  function navigateHorizontal(lineId: string, direction: 1 | -1) {
    const doc = documentRef.current;
    if (!doc) return;
    const target = adjacentLyricLine(doc, lineId, direction);
    if (!target) return;
    setPendingFocus({
      lineId: target.id,
      position: direction === 1 ? 0 : target.chars.length,
    });
  }

  function paletteAfterLineId(): string | null {
    if (focusRef.current?.kind === "lyric") return focusRef.current.lineId;
    if (activeCaretRef.current) return activeCaretRef.current.lineId;
    const lines = documentRef.current?.lines;
    return lines && lines.length > 0 ? lines[lines.length - 1].id : null;
  }

  /** Typing "/" in a lyric line opens the insert menu at that exact position. */
  function openSlashMenu(lineId: string, position: number) {
    setActiveCaret({ lineId, position });
    setFocus({ kind: "lyric", lineId });
    setShowPalette(true);
  }

  function insertChordAtCaret(name: string) {
    const caret = activeCaretRef.current;
    if (!caret) return;
    withDocument((doc) =>
      insertChordAt(doc, caret.lineId, caret.position, name, makeId),
    );
  }

  /** Typing ">" at the start of a lyric line converts it into a comment and focuses it. */
  function convertToComment(lineId: string) {
    const before = documentRef.current;
    if (!before) return;
    const index = before.lines.findIndex((l) => l.id === lineId);
    const next = convertLyricToComment(before, lineId, makeId);
    if (next === before) return;
    applyDocument(next);
    const newLine = next.lines[index];
    if (newLine) setFocus({ kind: "comment", lineId: newLine.id });
  }

  function insertCommentAfter(afterLineId: string | null) {
    const before = documentRef.current;
    if (!before) return;
    const index = afterLineId
      ? before.lines.findIndex((l) => l.id === afterLineId)
      : -1;
    const next = insertComment(before, afterLineId, "", makeId);
    applyDocument(next);
    const newLine =
      index === -1 ? next.lines[next.lines.length - 1] : next.lines[index + 1];
    if (newLine) setFocus({ kind: "comment", lineId: newLine.id });
  }

  /** Transposes every chord in the document, and updates the written `key` field to match. */
  function transpose(semitones: number) {
    withDocument((doc) => transposeDocument(doc, semitones));
    const currentKey = readSongSource(sourceRef.current)?.metadata.key;
    if (currentKey) updateMetadata("key", transposeKey(currentKey, semitones));
  }

  async function newDocument() {
    if (dirty && !(await confirmDiscard("Discard unsaved changes?"))) return;
    loadSource(EMPTY_SOURCE);
    justLoadedRef.current = true;
    setSavedSource(EMPTY_SOURCE);
    setPath(null);
    setStatus("New document");
  }

  async function openDocument() {
    if (dirty && !(await confirmDiscard("Discard unsaved changes?"))) return;
    try {
      const result = await openFile();
      if (!result) return;
      loadSource(result.source);
      justLoadedRef.current = true;
      setSavedSource(result.source);
      setPath(result.path);
      setStatus(`Opened ${fileNameFromPath(result.path)}`);
    } catch (error) {
      setStatus(`Open failed: ${String(error)}`);
    }
  }

  async function saveDocument(forceDialog = false) {
    try {
      if (!forceDialog && path) {
        await saveFile(path, sourceRef.current);
        setSavedSource(sourceRef.current);
        setStatus(`Saved ${fileNameFromPath(path)}`);
        return;
      }
      const destination = await saveFileAs(
        path ?? "untitled.chopro",
        sourceRef.current,
      );
      if (!destination) return;
      setPath(destination);
      setSavedSource(sourceRef.current);
      setStatus(`Saved ${fileNameFromPath(destination)}`);
    } catch (error) {
      setStatus(`Save failed: ${String(error)}`);
    }
  }

  useEffect(() => {
    try {
      const title = `${dirty ? "*" : ""}${fileNameFromPath(path)} - Coo`;
      getCurrentWindow()
        .setTitle(title)
        .catch(() => {});
    } catch {
      // Not running inside a Tauri webview (e.g. component tests) — window chrome is best-effort.
    }
  }, [dirty, path]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    try {
      const win = getCurrentWindow();
      win
        .onCloseRequested(async (event) => {
          if (sourceRef.current === savedSourceRef.current) return;
          event.preventDefault();
          if (await confirmDiscard("Close without saving your changes?"))
            win.destroy();
        })
        .then((fn) => {
          unlisten = fn;
        })
        .catch(() => {});
    } catch {
      // Not running inside a Tauri webview.
    }
    return () => unlisten?.();
  }, [confirmDiscard]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (matchesMod(event)) {
        const key = event.key.toLowerCase();
        if (key === "n") {
          event.preventDefault();
          newDocument();
          return;
        }
        if (key === "o") {
          event.preventDefault();
          openDocument();
          return;
        }
        if (key === "s") {
          event.preventDefault();
          saveDocument(event.shiftKey);
          return;
        }
        if (key === "e") {
          event.preventDefault();
          if (!parseError) setRawMode((value) => !value);
          return;
        }
        if (key === "m") {
          event.preventDefault();
          titleFieldRef.current?.focus();
          return;
        }
        if (key === "k") {
          event.preventDefault();
          setShowHelp((value) => !value);
          return;
        }
      }
      // Tab cycles chords while you're inside the song — no modifier, and it works
      // on every keyboard layout. Elsewhere (metadata fields, toolbar, the insert
      // menu, raw source) Tab keeps its normal move-focus behaviour, and Up/Down
      // still move between lyric lines.
      if (event.key === "Tab" && !matchesMod(event) && !event.altKey) {
        const active = window.document.activeElement;
        if (active?.closest(".document-view")) {
          event.preventDefault();
          navigateChords(event.shiftKey ? -1 : 1);
          return;
        }
      }
      if (event.key === "Escape") {
        if (showPalette) setShowPalette(false);
        else if (showHelp) setShowHelp(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <main className="app-shell">
      <header className="toolbar">
        <div className="toolbar-group">
          <button
            type="button"
            aria-label="New"
            title={`New (${MOD}N)`}
            onClick={newDocument}
          >
            <FilePlus2 size={16} />
          </button>
          <button
            type="button"
            aria-label="Open"
            title={`Open (${MOD}O)`}
            onClick={openDocument}
          >
            <FolderOpen size={16} />
          </button>
          <button
            type="button"
            aria-label="Save"
            title={`Save (${MOD}S)`}
            onClick={() => saveDocument()}
          >
            <Save size={16} />
          </button>
          <button
            type="button"
            aria-label="Save As"
            title={`Save As (${MOD}${SHIFT}S)`}
            onClick={() => saveDocument(true)}
          >
            <SaveAll size={16} />
          </button>
          <span className="file-title">
            {dirty ? "*" : ""}
            {fileNameFromPath(path)}
          </span>
        </div>
        <div className="toolbar-group">
          <button
            type="button"
            aria-label="Keyboard commands"
            title={`Keyboard commands (${MOD}K) · Toggle raw source (${MOD}E)`}
            onClick={() => setShowHelp(true)}
          >
            <CircleHelp size={16} />
          </button>
        </div>
      </header>

      {rawMode || !document ? (
        <RawSourceView
          source={source}
          error={parseError}
          onChange={editRawSource}
        />
      ) : (
        <>
          <MetadataBar
            source={source}
            onChange={updateMetadata}
            onTranspose={transpose}
            titleRef={titleFieldRef}
          />
          <div className="document-scroll">
            <section className="document-view">
              {document.lines.map((line) => {
                switch (line.kind) {
                  case "lyric":
                    return (
                      <LyricLine
                        key={line.id}
                        line={line}
                        focus={focus}
                        onChangeText={(text) =>
                          withDocument((doc) =>
                            setLyricText(doc, line.id, text),
                          )
                        }
                        onEnter={(caret) => {
                          if (!documentRef.current) return;
                          const before = documentRef.current;
                          const index = before.lines.findIndex(
                            (l) => l.id === line.id,
                          );
                          const next = splitLine(
                            before,
                            line.id,
                            caret,
                            makeId,
                          );
                          applyDocument(next);
                          const newLine = next.lines[index + 1];
                          if (newLine)
                            setPendingFocus({
                              lineId: newLine.id,
                              position: 0,
                            });
                        }}
                        onBackspaceAtStart={() => {
                          if (!documentRef.current) return;
                          const before = documentRef.current;
                          const index = before.lines.findIndex(
                            (l) => l.id === line.id,
                          );
                          const previous =
                            index > 0 ? before.lines[index - 1] : null;
                          const mergeAt =
                            previous?.kind === "lyric"
                              ? previous.chars.length
                              : 0;
                          const next = mergeLineUp(before, line.id);
                          if (next === before) return;
                          applyDocument(next);
                          if (previous?.kind === "lyric") {
                            setPendingFocus({
                              lineId: previous.id,
                              position: mergeAt,
                            });
                          } else {
                            setPendingFocus({ lineId: line.id, position: 0 });
                          }
                        }}
                        onCaretMove={(position) =>
                          setActiveCaret({ lineId: line.id, position })
                        }
                        onFocusLine={(position) => {
                          setFocus({ kind: "lyric", lineId: line.id });
                          setActiveCaret({ lineId: line.id, position });
                        }}
                        onNavigateUp={(position) =>
                          navigateVertical(line.id, position, -1)
                        }
                        onNavigateDown={(position) =>
                          navigateVertical(line.id, position, 1)
                        }
                        onNavigateLeft={() => navigateHorizontal(line.id, -1)}
                        onNavigateRight={() => navigateHorizontal(line.id, 1)}
                        onSlash={(position) => openSlashMenu(line.id, position)}
                        onGreaterThan={() => convertToComment(line.id)}
                        renameChord={(chordId, name) =>
                          withDocument((doc) => renameChord(doc, chordId, name))
                        }
                        deleteChord={(chordId) =>
                          withDocument((doc) => deleteChord(doc, chordId))
                        }
                        moveChord={(chordId, delta) =>
                          withDocument((doc) => moveChord(doc, chordId, delta))
                        }
                        moveChordToBoundary={(chordId, direction) =>
                          withDocument((doc) =>
                            moveChordToBoundary(doc, chordId, direction),
                          )
                        }
                        focusChord={focusChord}
                        focusAdjacentChord={focusAdjacentChord}
                        registerTextarea={registerTextarea}
                      />
                    );
                  case "heading":
                    return <HeadingLine key={line.id} line={line} />;
                  case "comment":
                    return (
                      <CommentLine
                        key={line.id}
                        line={line}
                        focused={
                          focus?.kind === "comment" && focus.lineId === line.id
                        }
                        onChange={(text) =>
                          withDocument((doc) =>
                            updateComment(doc, line.id, text),
                          )
                        }
                        onExit={() => navigateVertical(line.id, 0, 1)}
                      />
                    );
                  case "chorddef":
                    return (
                      <ChordDefinitionChip
                        key={line.id}
                        definition={line.definition}
                        onChange={(definition: ChordDefinition) =>
                          withDocument((doc) =>
                            upsertChordDefinition(
                              doc,
                              line.id,
                              definition,
                              makeId,
                            ),
                          )
                        }
                        onDelete={() =>
                          withDocument((doc) => deleteLine(doc, line.id))
                        }
                      />
                    );
                  case "passthrough":
                    return <PassthroughLine key={line.id} line={line} />;
                  default:
                    return null;
                }
              })}
            </section>
          </div>
        </>
      )}

      <footer className={parseError ? "error" : ""}>
        {parseError || status}
      </footer>

      {showPalette && (
        <CommandPalette
          onClose={() => setShowPalette(false)}
          onInsertChord={insertChordAtCaret}
          onInsertHeading={(section: HeadingSection) =>
            withDocument((doc) =>
              insertHeadingBlock(doc, paletteAfterLineId(), section, makeId),
            )
          }
          onInsertComment={() => insertCommentAfter(paletteAfterLineId())}
          onDefineChord={(name) => {
            const definition: ChordDefinition = {
              name,
              baseFret: 1,
              frets: ["x", "x", 0, 0, 0, 0],
              fingers: [],
            };
            withDocument((doc) =>
              upsertChordDefinition(
                doc,
                paletteAfterLineId(),
                definition,
                makeId,
              ),
            );
          }}
        />
      )}

      {showHelp && <KeyboardHelp onClose={() => setShowHelp(false)} />}

      {confirmRequest && (
        <div className="command-palette-overlay">
          <div className="confirm-dialog">
            <p>{confirmRequest.message}</p>
            <div className="confirm-actions">
              <button
                type="button"
                onClick={() => {
                  confirmRequest.resolve(false);
                  setConfirmRequest(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => {
                  confirmRequest.resolve(true);
                  setConfirmRequest(null);
                }}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
