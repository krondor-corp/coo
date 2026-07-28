import {
  type EditorDocument,
  type IdFactory,
  createIdFactory,
  parseDocument,
  serializeDocument,
  updateFrontmatterField,
} from "@repo/core";
import { useCallback, useRef, useState } from "react";
import type { Focus } from "./selection";

export type ActiveCaret = { lineId: string; position: number } | null;

/**
 * A run of edits closer together than this collapses into one undo step, so
 * undo doesn't walk back a letter at a time while you're typing lyrics.
 */
const COALESCE_MS = 500;
const MAX_HISTORY = 200;

export function useEditorState(initialSource: string) {
  const makeIdRef = useRef<IdFactory>(createIdFactory());
  const sourceRef = useRef(initialSource);
  // History holds whole serialized sources rather than per-command inverses:
  // every kind of edit (structured command, metadata field, raw source) already
  // funnels through `source`, so one mechanism covers all of them.
  const historyRef = useRef<{ past: string[]; future: string[] }>({
    past: [],
    future: [],
  });
  const lastPushRef = useRef(0);

  const initialParse = parseDocument(initialSource, makeIdRef.current);
  const [source, setSource] = useState(initialSource);
  const [document, setDocumentState] = useState<EditorDocument | null>(
    initialParse.ok ? initialParse.document : null,
  );
  const [parseError, setParseError] = useState<string | null>(
    initialParse.ok ? null : initialParse.error,
  );
  const [rawMode, setRawMode] = useState(!initialParse.ok);
  const [focus, setFocus] = useState<Focus>(null);
  const [activeCaret, setActiveCaret] = useState<ActiveCaret>(null);

  sourceRef.current = source;

  /** Records the pre-edit source as an undo step. `coalesce` merges quick successive keystrokes. */
  const pushHistory = useCallback((previous: string, coalesce: boolean) => {
    const history = historyRef.current;
    // Any fresh edit invalidates the redo stack — you've branched off it.
    history.future = [];
    const now = Date.now();
    const merged =
      coalesce &&
      history.past.length > 0 &&
      now - lastPushRef.current < COALESCE_MS;
    lastPushRef.current = now;
    if (merged) return;
    history.past.push(previous);
    if (history.past.length > MAX_HISTORY) history.past.shift();
  }, []);

  /** Reparses a source we've seen before (undo/redo), keeping the id factory so ids stay stable. */
  const restore = useCallback((nextSource: string) => {
    sourceRef.current = nextSource;
    setSource(nextSource);
    const result = parseDocument(nextSource, makeIdRef.current);
    setDocumentState(result.ok ? result.document : null);
    setParseError(result.ok ? null : result.error);
    // Whatever was selected may not exist in the restored document.
    setFocus(null);
  }, []);

  /** Loads a brand-new file (New/Open): resets the id factory for a fresh document lifetime. */
  const loadSource = useCallback((nextSource: string) => {
    makeIdRef.current = createIdFactory();
    sourceRef.current = nextSource;
    setSource(nextSource);
    const result = parseDocument(nextSource, makeIdRef.current);
    setDocumentState(result.ok ? result.document : null);
    setParseError(result.ok ? null : result.error);
    setRawMode(!result.ok);
    setFocus(null);
    setActiveCaret(null);
    // A different file starts a fresh timeline — you can't undo across an Open.
    historyRef.current = { past: [], future: [] };
    lastPushRef.current = 0;
  }, []);

  /** Applies raw-source-mode edits: reparses using the same id factory so ids stay stable. */
  const editRawSource = useCallback(
    (nextSource: string) => {
      pushHistory(sourceRef.current, true);
      sourceRef.current = nextSource;
      setSource(nextSource);
      const result = parseDocument(nextSource, makeIdRef.current);
      setDocumentState(result.ok ? result.document : null);
      setParseError(result.ok ? null : result.error);
    },
    [pushHistory],
  );

  /**
   * Applies a structured-editor command result: source is re-derived from the
   * document, never reparsed. `coalesce` is for character-by-character typing;
   * structural commands (insert, delete, move) each get their own undo step.
   */
  const applyDocument = useCallback(
    (next: EditorDocument, coalesce = false) => {
      pushHistory(sourceRef.current, coalesce);
      const nextSource = serializeDocument(sourceRef.current, next);
      sourceRef.current = nextSource;
      setSource(nextSource);
      setDocumentState(next);
    },
    [pushHistory],
  );

  const updateMetadata = useCallback(
    (field: string, value: string) => {
      pushHistory(sourceRef.current, true);
      const nextSource = updateFrontmatterField(
        sourceRef.current,
        field,
        value,
      );
      sourceRef.current = nextSource;
      setSource(nextSource);
    },
    [pushHistory],
  );

  const undo = useCallback(() => {
    const history = historyRef.current;
    const previous = history.past.pop();
    if (previous === undefined) return;
    history.future.push(sourceRef.current);
    lastPushRef.current = 0; // never coalesce across an undo
    restore(previous);
  }, [restore]);

  const redo = useCallback(() => {
    const history = historyRef.current;
    const next = history.future.pop();
    if (next === undefined) return;
    history.past.push(sourceRef.current);
    lastPushRef.current = 0;
    restore(next);
  }, [restore]);

  const makeId = useCallback(() => makeIdRef.current(), []);

  return {
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
    undo,
    redo,
    makeId,
  };
}

export type EditorStateApi = ReturnType<typeof useEditorState>;
