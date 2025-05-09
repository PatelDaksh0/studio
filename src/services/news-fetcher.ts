// src/services/news-fetcher.ts
'use server';
import { XMLParser } from 'fast-xml-parser';
import type { CnnHeadline } from '@/types';

interface RssItem {
  title: string | { '#text': string }; // Title can be a plain string or an object with #text
  link: string | { href?: string; '#text'?: string }; // Link can be a plain string, or an object with href or #text
  pubDate?: string;
  description?: string;
}

interface ParsedRss {
  rss?: {
    channel?: {
      item?: RssItem[] | RssItem; // Can be single item or array
    };
  };
  feed?: { // Atom feed structure
    entry?: RssItem[] | RssItem;
  };
}

export async function fetchRssFeed(
  url: string
): Promise<CnnHeadline[]> {
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.statusText} (status: ${response.status})`);
    }
    const xmlData = await response.text();
    
    // Handles common XML issues like Byte Order Mark (BOM)
    const cleanedXmlData = xmlData.trim().replace(/^\uFEFF/, '');

    const parser = new XMLParser({
      ignoreAttributes: false, // Keep attributes as some feeds use them for links
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      parseTagValue: true, // Convert primitive types e.g. "true" to true
      parseAttributeValue: true,
      trimValues: true,
    });
    const jsonObj = parser.parse(cleanedXmlData) as ParsedRss;

    let items: RssItem[] = [];

    if (jsonObj.rss && jsonObj.rss.channel && jsonObj.rss.channel.item) {
      items = Array.isArray(jsonObj.rss.channel.item)
        ? jsonObj.rss.channel.item
        : [jsonObj.rss.channel.item];
    } else if (jsonObj.feed && jsonObj.feed.entry) { // Handle Atom feed structure
       items = Array.isArray(jsonObj.feed.entry)
        ? jsonObj.feed.entry
        : [jsonObj.feed.entry];
    } else {
        console.warn('RSS feed structure not recognized or empty:', jsonObj);
        throw new Error('Invalid or unrecognized RSS feed structure');
    }
    
    return items.map(item => {
      let title = '';
      if (typeof item.title === 'string') {
        title = item.title;
      } else if (item.title && typeof item.title['#text'] === 'string') {
        title = item.title['#text'];
      }

      let link = '';
      if (typeof item.link === 'string') {
        link = item.link;
      } else if (item.link && typeof item.link['@_href'] === 'string') { // Atom links are often in attributes
        link = item.link['@_href'];
      } else if (item.link && typeof item.link['#text'] === 'string') {
        link = item.link['#text'];
      }
      
      return {
        title: title,
        link: link,
        pubDate: typeof item.pubDate === 'string' ? item.pubDate : undefined,
      };
    }).filter(item => item.link && item.title); // Filter out items without links or titles
  } catch (error) {
    console.error('Error fetching or parsing RSS feed:', error);
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred while fetching news.');
  }
}
