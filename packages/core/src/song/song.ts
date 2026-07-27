import { readSongSource } from "../frontmatter";
import type { Song } from "./types";

function optionalNumber(value: string | undefined, field: string) {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ${field}: ${value}`);
  return parsed;
}

export function parseSong(raw: string): Song {
  const document = readSongSource(raw);
  if (!document) throw new Error("Song file missing frontmatter");
  const { metadata: data, body } = document;

  if (!data.title) throw new Error("Song missing title");
  const slug =
    data.slug ||
    data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  return {
    title: data.title,
    slug,
    key: data.key,
    tempo: optionalNumber(data.tempo, "tempo"),
    capo: optionalNumber(data.capo, "capo"),
    tuning: data.tuning,
    track: data.track,
    tags: data.tags
      ? data.tags
          .replace(/[\[\]]/g, "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : undefined,
    body: body.trim(),
  };
}
