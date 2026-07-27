import { joinFrontmatter, splitFrontmatter } from "../frontmatter";
import { parseSong } from "../song";
import { type IdFactory, createIdFactory } from "./ids";
import { parseLine, serializeLine } from "./lines";
import type { DocumentParseResult, EditorDocument } from "./types";

export function parseDocument(
  source: string,
  makeId: IdFactory = createIdFactory(),
): DocumentParseResult {
  const parts = splitFrontmatter(source);
  if (!parts) {
    return { ok: false, error: "Song file missing frontmatter" };
  }

  try {
    parseSong(source);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const lines = parts.body.split("\n").map((raw) => parseLine(raw, makeId));
  return { ok: true, document: { lines } };
}

export function serializeDocument(
  source: string,
  document: EditorDocument,
): string {
  const parts = splitFrontmatter(source);
  const block = parts ? parts.block : "";
  const body = document.lines.map(serializeLine).join("\n");
  return joinFrontmatter(block, body);
}
