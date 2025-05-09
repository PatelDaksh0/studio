// src/components/country-section.tsx
import type { NewsSummaryItem } from '@/types';
import { NewsSummaryCard } from './news-summary-card';
import { Separator } from './ui/separator';
import { Globe2 } from 'lucide-react';

type CountrySectionProps = {
  country: string;
  summaries: NewsSummaryItem[];
};

export function CountrySection({ country, summaries }: CountrySectionProps) {
  return (
    <section className="mb-12">
      <div className="flex items-center mb-6">
        <Globe2 className="h-8 w-8 mr-3 text-primary" />
        <h2 className="text-3xl font-bold text-primary">{country}</h2>
      </div>
      <Separator className="mb-8 bg-border/70" />
      {summaries.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {summaries.map((summaryItem) => (
            <NewsSummaryCard key={summaryItem.id} summaryItem={summaryItem} />
          ))}
        </div>
      ) : (
         <p className="text-muted-foreground">No summaries available for this country yet.</p>
      )}
    </section>
  );
}
