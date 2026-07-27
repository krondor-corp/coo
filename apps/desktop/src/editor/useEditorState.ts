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

export function useEditorState(initialSource: string) {
  const makeIdRef = useRef<IdFactory>(createIdFactory());
  const sourceRef = useRef(initialSource);

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
  }, []);

  /** Applies raw-source-mode edits: reparses using the same id factory so ids stay stable. */
  const editRawSource = useCallback((nextSource: string) => {
    sourceRef.current = nextSource;
    setSource(nextSource);
    const result = parseDocument(nextSource, makeIdRef.current);
    setDocumentState(result.ok ? result.document : null);
    setParseError(result.ok ? null : result.error);
  }, []);

  /** Applies a structured-editor command result: source is re-derived from the document, never reparsed. */
  const applyDocument = useCallback((next: EditorDocument) => {
    const nextSource = serializeDocument(sourceRef.current, next);
    sourceRef.current = nextSource;
    setSource(nextSource);
    setDocumentState(next);
  }, []);

  const updateMetadata = useCallback((field: string, value: string) => {
    const nextSource = updateFrontmatterField(sourceRef.current, field, value);
    sourceRef.current = nextSource;
    setSource(nextSource);
  }, []);

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
    makeId,
  };
}

export type EditorStateApi = ReturnType<typeof useEditorState>;
