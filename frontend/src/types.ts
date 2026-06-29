export type Preacher = {
  key: string;
  slug: string;
  name: string;
  preacher?: string | null;
  url: string;
  sermonCount: number;
  speakers?: Array<{
    key: string;
    sourceSlug: string;
    name: string;
    sermonCount: number;
  }>;
};

export type SermonListItem = {
  id: string;
  sourceSlug: string;
  channelName?: string | null;
  preacher?: string | null;
  title: string;
  youtubeUrl: string;
  publishedAt?: string | null;
  durationSeconds?: number | null;
  thumbnailUrl?: string | null;
  status: string;
  summaryShort?: string;
  topics: string[];
  bibleReferences: string[];
};

export type SermonDetail = SermonListItem & {
  summaryDetailed?: string;
  outline: Array<{
    title: string;
    points: string[];
  }>;
  keyQuotes: string[];
  transcript: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
};

export type SiteIndex = {
  generatedAt: string;
  stats: {
    sources: number;
    sermons: number;
    transcribed: number;
    summarized: number;
  };
  preachers: Preacher[];
  sermons: SermonListItem[];
};

export type SearchIndex = {
  entries: Array<{
    id: string;
    text: string;
  }>;
};
