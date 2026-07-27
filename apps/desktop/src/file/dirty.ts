export function isDirty(current: string, savedSource: string): boolean {
  return current !== savedSource;
}

export function fileNameFromPath(path: string | null): string {
  if (!path) return "Untitled.chopro";
  return path.split(/[\\/]/).pop() || path;
}
