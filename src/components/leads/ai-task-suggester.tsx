'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { handleSuggestTask } from '@/lib/actions';
import type { Lead } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Bot, Lightbulb, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const FormSchema = z.object({
  leadId: z.string({
    required_error: 'Please select a lead.',
  }),
});

export function AiTaskSuggester({ leads }: { leads: Lead[] }) {
  const [suggestion, setSuggestion] =
    useState<Awaited<ReturnType<typeof handleSuggestTask>> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    setSuggestion(null);
    const selectedLead = leads.find((lead) => lead.id === data.leadId);
    if (selectedLead) {
      const result = await handleSuggestTask({
        leadName: selectedLead.name,
        leadDescription: selectedLead.description,
        recentActivities: selectedLead.recentActivities,
      });
      setSuggestion(result);
    }
    setIsLoading(false);
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="text-primary" /> Intelligent Task Suggestions
            </CardTitle>
            <CardDescription>
              Let AI suggest the optimal next task for a lead.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="leadId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select a Lead</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a lead to analyze..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {leads
                        .filter((lead) => lead.stage !== 'Won' && lead.stage !== 'Lost')
                        .map((lead) => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Analyzing...' : 'Get Suggestion'}
            </Button>
          </CardFooter>
        </form>
      </Form>
      {suggestion && (
        <div className="p-4 pt-0">
          <Alert>
            <AlertTitle className="font-semibold text-primary">
              Suggested Next Task
            </AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p className="font-medium">{suggestion.suggestedTask}</p>
              <p className="text-muted-foreground text-sm">
                <strong>Reasoning:</strong> {suggestion.reasoning}
              </p>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </Card>
  );
}
