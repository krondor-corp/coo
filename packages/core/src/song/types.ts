export type SongMeta = {
  title: string;
  slug: string;
  key?: string;
  tempo?: number;
  capo?: number;
  tuning?: string;
  track?: string;
  tags?: string[];
};

export type Song = SongMeta & {
  body: string;
};
