// src/app/actions.ts
'use server';

import { z } from 'zod';
import { summarizeArticle, type SummarizeArticleOutput } from '@/ai/flows/summarize-article';

const UrlSchema = z.string().url({ message: "Please enter a valid URL." });

export interface SummarizationResult {
  message: string;
  data?: SummarizeArticleOutput & { originalUrl: string };
  error?: string;
  fieldErrors?: { url?: string[] };
}

export async function submitUrlForSummarization(
  url: string
): Promise<SummarizationResult> {
  try {
    UrlSchema.parse(url);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { 
        message: "Validation Error", 
        error: "Invalid URL provided.",
        fieldErrors: err.flatten().fieldErrors as { url?: string[] }
      };
    }
    return { message: "Validation Error", error: "Invalid input." };
  }

  try {
    const result = await summarizeArticle({ url });
    return { 
      message: 'Article summarized successfully!', 
      data: { ...result, originalUrl: url } 
    };
  } catch (e) {
    console.error("Error in submitUrlForSummarization:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during summarization.";
    return { 
      message: 'Summarization Failed', 
      error: errorMessage 
    };
  }
}
