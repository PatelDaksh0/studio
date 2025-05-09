// src/components/news-summary-card.tsx
import type { NewsSummaryItem } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Globe } from 'lucide-react';
import Link from 'next/link';

type NewsSummaryCardProps = {
  summaryItem: NewsSummaryItem;
};

export function NewsSummaryCard({ summaryItem }: NewsSummaryCardProps) {
  return (
    <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out rounded-lg overflow-hidden">
      <CardHeader className="pb-3">
        {summaryItem.country && (
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <Globe className="h-4 w-4 mr-2 text-accent" />
            <span>{summaryItem.country}</span>
          </div>
        )}
        <CardTitle className="text-xl font-semibold leading-tight">Article Summary</CardTitle>
        <CardDescription className="text-sm text-muted-foreground pt-1 break-all">
          Original: <Link href={summaryItem.originalUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{summaryItem.originalUrl}</Link>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-foreground/90 leading-relaxed whitespace-pre-line">
          {summaryItem.summary}
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild variant="link" className="text-accent p-0 h-auto hover:underline">
          <Link href={summaryItem.originalUrl} target="_blank" rel="noopener noreferrer">
            Read Original Article
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
