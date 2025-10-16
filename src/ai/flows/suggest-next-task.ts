'use server';

/**
 * @fileOverview An AI agent to suggest the next best task for a given lead.
 *
 * - suggestNextTask - A function that suggests the next best task for a lead.
 * - SuggestNextTaskInput - The input type for the suggestNextTask function.
 * - SuggestNextTaskOutput - The return type for the suggestNextTask function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestNextTaskInputSchema = z.object({
  leadName: z.string().describe('The name of the lead.'),
  leadDescription: z.string().describe('A detailed description of the lead and their current status.'),
  recentActivities: z.string().describe('A summary of recent activities related to the lead.'),
});
export type SuggestNextTaskInput = z.infer<typeof SuggestNextTaskInputSchema>;

const SuggestNextTaskOutputSchema = z.object({
  suggestedTask: z.string().describe('The next best task to perform for the lead.'),
  reasoning: z.string().describe('The reasoning behind the suggested task.'),
});
export type SuggestNextTaskOutput = z.infer<typeof SuggestNextTaskOutputSchema>;

export async function suggestNextTask(input: SuggestNextTaskInput): Promise<SuggestNextTaskOutput> {
  return suggestNextTaskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestNextTaskPrompt',
  input: {schema: SuggestNextTaskInputSchema},
  output: {schema: SuggestNextTaskOutputSchema},
  prompt: `You are an AI assistant helping sales teams prioritize their tasks.

  Given a lead, their description, and recent activities, suggest the single next best task to perform.

  Lead Name: {{leadName}}
  Lead Description: {{leadDescription}}
  Recent Activities: {{recentActivities}}

  Consider all available information and suggest the single, most impactful next task. Explain your reasoning.

  Format your response as:
  {
    "suggestedTask": "The suggested next task",
    "reasoning": "The reasoning behind the suggested task"
  }`,
});

const suggestNextTaskFlow = ai.defineFlow(
  {
    name: 'suggestNextTaskFlow',
    inputSchema: SuggestNextTaskInputSchema,
    outputSchema: SuggestNextTaskOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
