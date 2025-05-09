import type { SummarizeArticleOutput } from '@/ai/flows/summarize-article';

export interface NewsSummaryItem extends SummarizeArticleOutput {
  id: string;
  originalUrl: string;
}

export interface CnnHeadline {
  title: string;
  link: string;
  pubDate?: string;
}
