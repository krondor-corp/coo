export function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  const platform = navigator.platform ?? navigator.userAgent ?? "";
  return /Mac|iPhone|iPad/.test(platform);
}

/**
 * Mod = Cmd on macOS, Ctrl on Windows/Linux. Accepts either modifier regardless of platform
 * detection, since a misdetected platform must never make a shortcut silently unusable.
 */
export function matchesMod(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey;
}
