export type SongSource = {
  metadata: Record<string, string>;
  body: string;
};

export type Frontmatter = { block: string; body: string };
