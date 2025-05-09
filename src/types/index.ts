import type { SummarizeArticleOutput } from '@/ai/flows/summarize-article';

export interface NewsSummaryItem extends SummarizeArticleOutput {
  id: string;
  originalUrl: string;
}
