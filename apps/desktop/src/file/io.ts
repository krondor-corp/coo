import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

const OPEN_FILTERS = [
  { name: "ChordPro", extensions: ["chopro", "cho", "crd", "pro"] },
];
const SAVE_FILTERS = [{ name: "ChordPro", extensions: ["chopro"] }];

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
