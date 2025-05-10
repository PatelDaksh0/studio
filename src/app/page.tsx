// src/app/page.tsx
"use client";

import { useState, useMemo, useCallback } from 'react';
import type { NewsSummaryItem, CnnHeadline } from '@/types';
import { NewsBriefForm } from '@/components/news-brief-form';
import { CountrySection } from '@/components/country-section';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { BookMarked, Newspaper, Loader2 as PageLoader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { fetchCnnLatestStoriesAction, submitUrlForSummarization } from '@/app/actions';

export default function NewsBriefPage() {
  const [summaries, setSummaries] = useState<NewsSummaryItem[]>([]);
  const [isProcessingForm, setIsProcessingForm] = useState(false); // For the manual URL form
  const [isProcessingDirect, setIsProcessingDirect] = useState(false); // For direct summarization from CNN list
  
  const [cnnHeadlines, setCnnHeadlines] = useState<CnnHeadline[] | null>(null);
  const [isLoadingCnnHeadlines, setIsLoadingCnnHeadlines] = useState(false);
  const { toast } = useToast();

  const handleAddSummary = (newSummary: NewsSummaryItem) => {
    setSummaries(prevSummaries => [newSummary, ...prevSummaries]);
  };

  const groupedSummaries = useMemo(() => {
    return summaries.reduce((acc, summary) => {
      const countryKey = summary.country || "Uncategorized";
      if (!acc[countryKey]) {
        acc[countryKey] = [];
      }
      acc[countryKey].push(summary);
      return acc;
    }, {} as Record<string, NewsSummaryItem[]>);
  }, [summaries]);

  const sortedCountryKeys = useMemo(() => {
    return Object.keys(groupedSummaries).sort((a, b) => {
      if (a === "Uncategorized") return 1;
      if (b === "Uncategorized") return -1;
      return a.localeCompare(b);
    });
  }, [groupedSummaries]);

  const loadCnnHeadlines = useCallback(async () => {
    setIsLoadingCnnHeadlines(true);
    setCnnHeadlines(null);
    const result = await fetchCnnLatestStoriesAction();
    if (result.headlines) {
      setCnnHeadlines(result.headlines);
      if (result.headlines.length > 0) {
        toast({ title: "Latest CNN Stories Loaded", description: `${result.headlines.length} stories fetched.` });
      } else {
        toast({ title: "Latest CNN Stories", description: "No stories found in the feed." });
      }
    } else if (result.error) {
      toast({ variant: "destructive", title: "Error Loading Latest CNN Stories", description: result.error });
    }
    setIsLoadingCnnHeadlines(false);
  }, [toast]);

  const handleSummarizeCnnArticle = useCallback(async (articleUrl: string, articleTitle?: string) => {
    setIsProcessingDirect(true);
    toast({ title: "Summarizing Article", description: `Processing: ${articleTitle || articleUrl}`});
    const result = await submitUrlForSummarization(articleUrl);
    if (result.data) {
      handleAddSummary({ ...result.data, id: crypto.randomUUID() });
      toast({ title: "Success!", description: result.message });
    } else if (result.error) {
      toast({ variant: "destructive", title: "Summarization Error", description: result.error });
    }
    setIsProcessingDirect(false);
  }, [toast]);

  const isAnyProcessing = isProcessingForm || isProcessingDirect;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <header className="py-8 px-4 md:px-8 shadow-md bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookMarked className="h-10 w-10 text-accent" />
            <h1 className="text-4xl font-bold tracking-tight text-primary">
              NewsBrief
            </h1>
          </div>
          <p className="text-sm text-muted-foreground hidden md:block">AI-Powered Article Summaries</p>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 md:px-8 py-12">
        <section aria-labelledby="submit-url-heading" className="mb-12 flex flex-col items-center">
          <div className="w-full max-w-xl p-8 bg-card rounded-xl shadow-2xl">
            <h2 id="submit-url-heading" className="text-2xl font-semibold text-center text-primary mb-6">
              Summarize any news article
            </h2>
            <NewsBriefForm 
              onSummaryAdded={handleAddSummary} 
              isProcessing={isProcessingForm}
              setIsProcessing={setIsProcessingForm}
            />
            <div className="mt-6 text-center">
              <Button 
                onClick={loadCnnHeadlines} 
                disabled={isLoadingCnnHeadlines || isAnyProcessing}
                variant="outline"
                className="w-full md:w-auto"
              >
                {isLoadingCnnHeadlines ? (
                  <PageLoader className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Newspaper className="mr-2 h-5 w-5" />
                )}
                {cnnHeadlines ? "Refresh Latest CNN Stories" : "Load Latest CNN Stories"}
              </Button>
            </div>
          </div>
        </section>
        
        {isLoadingCnnHeadlines && (
           <div className="text-center py-10">
             <PageLoader className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
             <p className="text-lg text-muted-foreground">Fetching latest CNN stories...</p>
           </div>
        )}

        {cnnHeadlines && cnnHeadlines.length > 0 && !isLoadingCnnHeadlines && (
             <section aria-labelledby="cnn-headlines-heading" className="mb-16">
               <h2 id="cnn-headlines-heading" className="text-2xl font-semibold text-primary mb-6 text-center md:text-left">
                 Latest from CNN
               </h2>
               <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-card shadow">
                 <ul className="space-y-3">
                   {cnnHeadlines.map((headline, index) => (
                     <li key={index} className="p-3 hover:bg-muted/50 rounded-md transition-colors">
                       <h3 className="font-medium text-primary mb-1">{headline.title}</h3>
                       {headline.pubDate && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {new Date(headline.pubDate).toLocaleString()}
                          </p>
                        )}
                       <Button
                         onClick={() => handleSummarizeCnnArticle(headline.link, headline.title)}
                         disabled={isAnyProcessing}
                         size="sm"
                         variant="link"
                         className="p-0 h-auto text-accent hover:underline"
                       >
                         Summarize this article
                         {isProcessingDirect && <PageLoader className="ml-2 h-4 w-4 animate-spin" />}
                       </Button>
                     </li>
                   ))}
                 </ul>
               </ScrollArea>
             </section>
           )}
        
        {isAnyProcessing && summaries.length === 0 && !isLoadingCnnHeadlines && (
           <div className="text-center py-10">
             <PageLoader className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
             <p className="text-lg text-muted-foreground">Summarizing your first article...</p>
           </div>
        )}

        {summaries.length === 0 && !isAnyProcessing && !isLoadingCnnHeadlines && (!cnnHeadlines || cnnHeadlines.length === 0) && (
          <div className="text-center py-20 flex flex-col items-center">
            <Image 
              src="https://picsum.photos/400/300" 
              alt="Abstract illustration representing news and articles" 
              width={400} 
              height={300} 
              className="rounded-lg mb-8 shadow-lg"
              data-ai-hint="news articles"
            />
            <h3 className="text-2xl font-semibold text-primary mb-4">Ready for your first brief?</h3>
            <p className="text-lg text-muted-foreground max-w-md">
              Paste a news article URL above, or load latest stories from CNN to get started.
            </p>
          </div>
        )}

        {summaries.length > 0 && (
          <ScrollArea className="h-full"> 
            <div className="space-y-12">
              {sortedCountryKeys.map(country => (
                <CountrySection
                  key={country}
                  country={country}
                  summaries={groupedSummaries[country]}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </main>

      <footer className="py-6 text-center text-muted-foreground text-sm border-t border-border/50 bg-card/50">
        <p>&copy; {new Date().getFullYear()} NewsBrief. All rights reserved.</p>
        <p>Powered by Genkit AI</p>
      </footer>
    </div>
  );
}

