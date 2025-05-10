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

// Helper function to check if a date string is within the last 7 days (including today)
const isFromRelevantDays = (pubDateString?: string): boolean => {
  if (!pubDateString) return false;
  try {
    const pubDate = new Date(pubDateString);
    
    // Get current date and time
    const now = new Date();

    // Calculate the date 7 days ago from now
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    // Set to the beginning of that day for comparison
    const startOfSevenDaysAgo = new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate(), 0, 0, 0, 0);

    // pubDate must be on or after the start of sevenDaysAgo and not in the future
    return pubDate.getTime() >= startOfSevenDaysAgo.getTime() && pubDate.getTime() <= now.getTime();
  } catch (e) {
    console.warn("Could not parse pubDate for filtering:", pubDateString, e);
    return false; // If date is unparseable, don't include it
  }
};


export async function fetchCnnWorldNewsAction(): Promise<FetchCnnHeadlinesResult> {
    try {
        let headlines = await fetchRssFeed(CNN_WORLD_NEWS_RSS_URL);
        
        // Filter for the last 7 days
        headlines = headlines.filter(headline => isFromRelevantDays(headline.pubDate));

        // Sort by pubDate descending (most recent first)
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

