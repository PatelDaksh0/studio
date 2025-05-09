// src/app/page.tsx
"use client";

import { useState, useMemo } from 'react';
import type { NewsSummaryItem } from '@/types';
import { NewsBriefForm } from '@/components/news-brief-form';
import { CountrySection } from '@/components/country-section';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { BookMarked } from 'lucide-react';

export default function NewsBriefPage() {
  const [summaries, setSummaries] = useState<NewsSummaryItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

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
      if (a === "Uncategorized") return 1; // Push "Uncategorized" to the end
      if (b === "Uncategorized") return -1;
      return a.localeCompare(b); // Sort other countries alphabetically
    });
  }, [groupedSummaries]);

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
        <section aria-labelledby="submit-url-heading" className="mb-16 flex flex-col items-center">
          <div className="w-full max-w-xl p-8 bg-card rounded-xl shadow-2xl">
            <h2 id="submit-url-heading" className="text-2xl font-semibold text-center text-primary mb-6">
              Summarize any news article instantly
            </h2>
            <NewsBriefForm 
              onSummaryAdded={handleAddSummary} 
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />
          </div>
        </section>
        
        {isProcessing && summaries.length === 0 && (
           <div className="text-center py-10">
             <p className="text-lg text-muted-foreground">Summarizing your first article...</p>
           </div>
        )}

        {summaries.length === 0 && !isProcessing ? (
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
              Paste a news article URL above to get a concise AI-generated summary. 
              It's fast, easy, and helps you stay informed.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full"> {/* Adjust height as needed or remove if page scroll is preferred */}
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
