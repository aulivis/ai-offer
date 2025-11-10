/**
 * Conversation summarization utilities
 *
 * Summarizes older conversation messages to maintain context while reducing tokens.
 * This is useful for long conversations that exceed the context window.
 */

import type { OpenAI } from 'openai';

/**
 * Summarizes older messages in a conversation to reduce token usage.
 *
 * @param messages - Array of conversation messages
 * @param openai - OpenAI client instance
 * @param maxRecentMessages - Number of recent messages to keep verbatim (default: 10)
 * @returns Summarized conversation with recent messages intact
 */
export async function summarizeConversation(
  messages: Array<{ role: string; content: string }>,
  openai: OpenAI,
  maxRecentMessages: number = 10,
): Promise<Array<{ role: string; content: string }>> {
  // If conversation is short, no need to summarize
  if (messages.length <= maxRecentMessages) {
    return messages;
  }

  // Split messages into old (to summarize) and recent (to keep)
  const oldMessages = messages.slice(0, messages.length - maxRecentMessages);
  const recentMessages = messages.slice(-maxRecentMessages);

  // If old messages are empty, return recent messages
  if (oldMessages.length === 0) {
    return recentMessages;
  }

  try {
    // Generate summary of old messages
    const summary = await generateSummary(oldMessages, openai);

    // Return summary as a system message + recent messages
    return [
      {
        role: 'assistant',
        content: `[Previous conversation summary: ${summary}]`,
      },
      ...recentMessages,
    ];
  } catch (error) {
    console.warn('Failed to summarize conversation:', error);
    // If summarization fails, just return recent messages
    return recentMessages;
  }
}

/**
 * Generates a summary of conversation messages.
 *
 * @param messages - Messages to summarize
 * @param openai - OpenAI client instance
 * @returns Summary text
 */
async function generateSummary(
  messages: Array<{ role: string; content: string }>,
  openai: OpenAI,
): Promise<string> {
  const conversationText = messages.map((m) => `${m.role}: ${m.content}`).join('\n\n');

  const prompt = `Summarize the following conversation in 2-3 sentences, focusing on:
- Key topics discussed
- User's main questions or concerns
- Important context or information shared

Conversation:
${conversationText}

Summary:`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 150,
    temperature: 0.3, // Lower temperature for more factual summaries
  });

  return response.choices[0]?.message?.content?.trim() || 'No summary available.';
}

/**
 * Checks if a conversation should be summarized based on token count.
 *
 * @param messages - Conversation messages
 * @param maxTokens - Maximum tokens before summarizing (default: 2000)
 * @returns True if conversation should be summarized
 */
export function shouldSummarize(
  messages: Array<{ role: string; content: string }>,
  maxTokens: number = 2000,
): boolean {
  // Rough token estimation: ~4 characters per token
  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  const estimatedTokens = Math.ceil(totalChars / 4);

  return estimatedTokens > maxTokens;
}

