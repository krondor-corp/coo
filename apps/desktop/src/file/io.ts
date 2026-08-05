import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeFile, writeTextFile } from "@tauri-apps/plugin-fs";

const OPEN_FILTERS = [
  { name: "ChordPro", extensions: ["chopro", "cho", "crd", "pro"] },
];
const SAVE_FILTERS = [{ name: "ChordPro", extensions: ["chopro"] }];
const PDF_FILTERS = [{ name: "PDF", extensions: ["pdf"] }];

export async function openFile(): Promise<{
  path: string;
  source: string;
} | null> {
  const selected = await open({ multiple: false, filters: OPEN_FILTERS });
  if (typeof selected !== "string") return null;
  const source = await readTextFile(selected);
  return { path: selected, source };
}

export async function saveFile(path: string, source: string): Promise<void> {
  await writeTextFile(path, source);
}

export async function saveFileAs(
  defaultPath: string,
  source: string,
): Promise<string | null> {
  const destination = await save({ defaultPath, filters: SAVE_FILTERS });
  if (!destination) return null;
  await writeTextFile(destination, source);
  return destination;
}

/** Writes a rendered chart to disk, returning where it landed (or null if cancelled). */
export async function savePdfAs(
  defaultPath: string,
  bytes: Uint8Array,
): Promise<string | null> {
  const destination = await save({ defaultPath, filters: PDF_FILTERS });
  if (!destination) return null;
  await writeFile(destination, bytes);
  return destination;
}
