// src/components/news-brief-form.tsx
"use client";

import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { submitUrlForSummarization, type SummarizationResult } from '@/app/actions';
import type { NewsSummaryItem } from '@/types';
import { Loader2, Sparkles, Link2 } from 'lucide-react';

const FormSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL." }),
});

type NewsBriefFormProps = {
  onSummaryAdded: (summary: NewsSummaryItem) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
};

export function NewsBriefForm({ onSummaryAdded, isProcessing, setIsProcessing }: NewsBriefFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      url: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsProcessing(true);
    try {
      const result: SummarizationResult = await submitUrlForSummarization(data.url);

      if (result.data) {
        onSummaryAdded({ ...result.data, id: crypto.randomUUID() });
        toast({
          title: "Success!",
          description: result.message,
        });
        form.reset();
      } else if (result.fieldErrors?.url) {
        form.setError("url", { type: "manual", message: result.fieldErrors.url.join(', ') });
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: result.fieldErrors.url.join(', '),
        });
      } else if (result.error) {
         toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-xl space-y-6">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="url-input" className="text-lg">Article URL</FormLabel>
              <FormControl>
                <div className="relative flex items-center">
                  <Link2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    id="url-input"
                    placeholder="https://example.com/news-article" 
                    {...field} 
                    className="pl-10 text-base h-12 rounded-md shadow-sm" 
                    aria-describedby="url-form-message"
                  />
                </div>
              </FormControl>
              <FormMessage id="url-form-message" />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isProcessing} className="w-full h-12 text-lg rounded-md shadow-md hover:shadow-lg transition-shadow duration-200">
          {isProcessing ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-5 w-5" />
          )}
          Summarize Article
        </Button>
      </form>
    </Form>
  );
}
