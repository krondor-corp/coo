import type { Frontmatter, SongSource } from "./types";

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;

export function readSongSource(raw: string): SongSource | null {
  const normalized = raw.replace(/\r\n?/g, "\n");
  const match = normalized.match(FRONTMATTER_RE);
  if (!match) return null;

  const metadata: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const field = line.match(/^(\w+):\s*(.*)$/);
    if (field) metadata[field[1]] = field[2].replace(/^["']|["']$/g, "");
  }
  return { metadata, body: match[2] };
}

/** Like readSongSource, but keeps the frontmatter block as raw text instead of parsing it into fields. */
export function splitFrontmatter(source: string): Frontmatter | null {
  const normalized = source.replace(/\r\n?/g, "\n");
  const match = normalized.match(FRONTMATTER_RE);
  if (!match) return null;
  return { block: match[1], body: match[2] };
}

export function joinFrontmatter(block: string, body: string): string {
  return `---\n${block}\n---\n${body}`;
}

export function updateFrontmatterField(
  source: string,
  field: string,
  value: string,
): string {
  const parts = splitFrontmatter(source);
  if (!parts) return source;

  const safeValue = value.replace(/\r?\n/g, " ");
  const lines = parts.block.split("\n");
  const index = lines.findIndex((line) => line.startsWith(`${field}:`));

  if (safeValue) {
    const next = `${field}: ${safeValue}`;
    if (index === -1) lines.push(next);
    else lines[index] = next;
  } else if (index !== -1) {
    lines.splice(index, 1);
  }

  return joinFrontmatter(lines.join("\n"), parts.body);
}
