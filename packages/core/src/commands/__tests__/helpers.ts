import {
  type EditorDocument,
  type IdFactory,
  type LyricLine,
  createIdFactory,
  parseDocument,
} from "../../document";

export function doc(
  body: string,
  makeId: IdFactory = createIdFactory(),
): EditorDocument {
  const result = parseDocument(`---\ntitle: Test\n---\n${body}`, makeId);
  if (!result.ok) throw new Error(result.error);
  return result.document;
}

export function lyric(document: EditorDocument, index = 0): LyricLine {
  const line = document.lines[index];
  if (line.kind !== "lyric") throw new Error(`line ${index} is not lyric`);
  return line;
}
