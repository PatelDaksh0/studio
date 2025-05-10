// src/app/actions.ts
'use server';

import { z } from 'zod';
import { summarizeArticle, type SummarizeArticleOutput } from '@/ai/flows/summarize-article';
import { fetchRssFeed } from '@/services/news-fetcher';
import type { CnnHeadline } from '@/types';

const UrlSchema = z.string().url({ message: "Please enter a valid URL." });

export interface SummarizationResult {
  message: string;
  data?: SummarizeArticleOutput & { originalUrl: string };
  error?: string;
  fieldErrors?: { url?: string[] };
}

export async function submitUrlForSummarization(
  url:string
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

const CNN_WORLD_NEWS_RSS_URL = 'http://rss.cnn.com/rss/cnn_world.rss';
   
export interface FetchCnnHeadlinesResult {
    headlines?: CnnHeadline[];
    error?: string;
}

// Helper function to check if a date string corresponds to yesterday or the day before yesterday
const isFromRelevantDays = (pubDateString?: string): boolean => {
  if (!pubDateString) return false;
  try {
    const pubDate = new Date(pubDateString);
    
    // Get start of today in server's local timezone
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const yesterday = new Date(startOfToday);
    yesterday.setDate(startOfToday.getDate() - 1); // Start of yesterday

    const dayBeforeYesterday = new Date(startOfToday);
    dayBeforeYesterday.setDate(startOfToday.getDate() - 2); // Start of day before yesterday

    // Normalize pubDate to its start of day in server's local timezone
    const startOfPubDateDay = new Date(pubDate.getFullYear(), pubDate.getMonth(), pubDate.getDate());

    return startOfPubDateDay.getTime() === yesterday.getTime() || 
           startOfPubDateDay.getTime() === dayBeforeYesterday.getTime();
  } catch (e) {
    console.warn("Could not parse pubDate for filtering:", pubDateString, e);
    return false; // If date is unparseable, don't include it
  }
};


export async function fetchCnnWorldNewsAction(): Promise<FetchCnnHeadlinesResult> {
    try {
        let headlines = await fetchRssFeed(CNN_WORLD_NEWS_RSS_URL);
        
        // Filter for yesterday and day before yesterday
        headlines = headlines.filter(headline => isFromRelevantDays(headline.pubDate));

        // Sort by pubDate descending (most recent of the two days first)
        headlines.sort((a, b) => {
            const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
            const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
            return dateB - dateA;
        });

        return { headlines };
    } catch (error) {
        console.error('Error in fetchCnnWorldNewsAction:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch CNN world news.';
        return { error: errorMessage };
    }
}
