/**
 * Multi-query retrieval utilities
 * 
 * Generates multiple query variations to improve recall for ambiguous queries.
 * This helps retrieve relevant documents even when the original query doesn't
 * match the exact wording in the documents.
 */

import type { OpenAI } from 'openai';

/**
 * Generates query variations from an original query.
 * 
 * @param originalQuery - Original user query
 * @param openai - OpenAI client instance
 * @returns Array of query variations (including original)
 */
export async function generateQueryVariations(
  originalQuery: string,
  openai: OpenAI
): Promise<string[]> {
  try {
    // For short queries, skip variation generation
    if (originalQuery.length < 10) {
      return [originalQuery];
    }
    
    const prompt = `You are a helpful assistant that generates search query variations.

Original query: "${originalQuery}"

Generate 2-3 different search queries that would help find relevant information about the same topic.
The variations should:
- Use different wording but maintain the same intent
- Cover different aspects of the topic
- Be specific and clear

Return ONLY a JSON object with a "queries" array of strings, no other text.
Example: {"queries": ["query variation 1", "query variation 2", "query variation 3"]}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    const variations = parsed.queries || [];
    
    // Validate variations
    const validVariations = variations
      .filter((q: any) => typeof q === 'string' && q.trim().length > 0)
      .slice(0, 3); // Limit to 3 variations
    
    // Return original query + variations (limit to 4 total)
    return [originalQuery, ...validVariations].slice(0, 4);
  } catch (error) {
    console.warn('Failed to generate query variations:', error);
    // Fallback to original query if variation generation fails
    return [originalQuery];
  }
}

/**
 * Simple query expansion using synonyms (fallback method).
 * 
 * @param query - Original query
 * @returns Array of query variations
 */
export function expandQuerySimple(query: string): string[] {
  // Simple expansion: add common synonyms and variations
  const variations: string[] = [query];
  
  // Add lowercase version
  if (query !== query.toLowerCase()) {
    variations.push(query.toLowerCase());
  }
  
  // Add question form if not already a question
  if (!query.trim().endsWith('?')) {
    variations.push(`${query}?`);
  }
  
  return variations.slice(0, 3); // Limit to 3 variations
}

