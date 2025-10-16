'use server';

import {
  suggestNextTask,
  type SuggestNextTaskInput,
  type SuggestNextTaskOutput,
} from '@/ai/flows/suggest-next-task';

export async function handleSuggestTask(
  input: SuggestNextTaskInput
): Promise<SuggestNextTaskOutput> {
  try {
    const result = await suggestNextTask(input);
    return result;
  } catch (error) {
    console.error('Error suggesting next task:', error);
    // Provide a user-friendly error message
    return {
      suggestedTask: 'Could not generate suggestion',
      reasoning:
        'There was an issue connecting to the AI service. Please check your configuration and try again.',
    };
  }
}
