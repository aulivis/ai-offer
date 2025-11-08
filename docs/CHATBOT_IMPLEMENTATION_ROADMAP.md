# Chatbot Implementation Roadmap - Quick Reference

## Quick Start: Priority Improvements

This document provides a practical roadmap for improving the chatbot based on 2025 industry best practices.

---

## Phase 1: Quick Wins (Week 1-2)

### 1.1 Add Source Citations with Links

**Current Issue**: Sources are shown as plain text paths.

**Solution**: Add clickable links and better formatting.

**File**: `web/src/lib/chatbot/retrieval.ts`

```typescript
export function formatContext(documents: RetrievedDocument[]): string {
  if (documents.length === 0) {
    return 'No relevant documentation found.';
  }
  
  return documents
    .map((doc, index) => {
      const source = doc.sourcePath;
      const heading = doc.metadata.heading as string | undefined;
      const section = heading ? ` (${heading})` : '';
      
      // Add clickable link format for markdown
      const sourceLink = `[${index + 1}] [${source}${section}](/${source})`;
      
      return `${sourceLink}\n${doc.content}`;
    })
    .join('\n\n---\n\n');
}
```

**File**: `web/src/components/chatbot/Chatbot.tsx`

```typescript
// Update message rendering to parse markdown links
import { marked } from 'marked'; // Add marked package

const getMessageText = (message: typeof messages[0]): string => {
  // ... existing code ...
  const text = message.parts
    .filter((part: any) => part.type === 'text')
    .map((part: any) => part.text || '')
    .join('');
  
  // Parse markdown and render links
  return marked.parse(text);
};
```

### 1.2 Add User Feedback

**File**: `web/src/components/chatbot/Chatbot.tsx`

```typescript
// Add state for feedback
const [feedback, setFeedback] = useState<Record<string, 'up' | 'down' | null>>({});

// Add feedback UI after each assistant message
{messages.map((message) => (
  <div key={message.id}>
    {/* ... existing message rendering ... */}
    {message.role === 'assistant' && (
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={() => handleFeedback(message.id, 'up')}
          className={`p-1 rounded ${feedback[message.id] === 'up' ? 'bg-green-100' : ''}`}
          aria-label="Thumbs up"
        >
          👍
        </button>
        <button
          onClick={() => handleFeedback(message.id, 'down')}
          className={`p-1 rounded ${feedback[message.id] === 'down' ? 'bg-red-100' : ''}`}
          aria-label="Thumbs down"
        >
          👎
        </button>
      </div>
    )}
  </div>
))}

// Add feedback handler
const handleFeedback = async (messageId: string, type: 'up' | 'down') => {
  setFeedback(prev => ({ ...prev, [messageId]: type }));
  
  // Send feedback to API
  await fetch('/api/chatbot/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageId, type }),
  });
};
```

**File**: `web/src/app/api/chatbot/feedback/route.ts` (new)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';

export async function POST(req: NextRequest) {
  try {
    const { messageId, type } = await req.json();
    
    const supabase = supabaseServiceRole();
    await supabase.from('chatbot_feedback').insert({
      message_id: messageId,
      feedback_type: type,
      created_at: new Date().toISOString(),
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}
```

### 1.3 Improve Error Messages

**File**: `web/src/app/api/chatbot/route.ts`

```typescript
// Add more helpful error messages
catch (error) {
  log.error('Error processing chatbot query', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  
  // Check for specific error types
  if (error instanceof Error) {
    if (error.message.includes('rate limit')) {
      return NextResponse.json(
        { error: 'Túl sok kérés. Kérjük, várj egy pillanatot.' },
        { status: 429 }
      );
    }
    
    if (error.message.includes('embedding')) {
      return NextResponse.json(
        { error: 'Hiba történt a kérdés feldolgozása során. Kérjük, próbáld újra.' },
        { status: 500 }
      );
    }
  }
  
  return NextResponse.json(
    { error: 'Váratlan hiba történt. Kérjük, próbáld meg újra később.' },
    { status: 500 }
  );
}
```

---

## Phase 2: RAG Improvements (Week 3-4)

### 2.1 Implement Query Re-ranking

**Install dependency**:
```bash
npm install @xenova/transformers
```

**File**: `web/src/lib/chatbot/reranking.ts` (new)

```typescript
import { pipeline, Pipeline } from '@xenova/transformers';
import type { RetrievedDocument } from './retrieval';

let reranker: Pipeline | null = null;

export async function initializeReranker() {
  if (!reranker) {
    reranker = await pipeline(
      'text-classification',
      'Xenova/cross-encoder-ms-marco-MiniLM-L-6-v2'
    );
  }
  return reranker;
}

export async function rerankDocuments(
  query: string,
  documents: RetrievedDocument[],
  topK: number = 5
): Promise<RetrievedDocument[]> {
  if (documents.length <= topK) {
    return documents;
  }
  
  const model = await initializeReranker();
  
  // Score each document
  const scoredDocs = await Promise.all(
    documents.map(async (doc) => {
      try {
        const result = await model(query, doc.content);
        const score = Array.isArray(result) ? result[0]?.score : result.score;
        return {
          ...doc,
          rerankScore: score || 0,
        };
      } catch (error) {
        console.warn('Reranking error for document:', error);
        return { ...doc, rerankScore: doc.similarity };
      }
    })
  );
  
  // Sort by rerank score and return top K
  return scoredDocs
    .sort((a, b) => (b.rerankScore || 0) - (a.rerankScore || 0))
    .slice(0, topK);
}
```

**File**: `web/src/app/api/chatbot/route.ts`

```typescript
import { rerankDocuments } from '@/lib/chatbot/reranking';

// After retrieving documents:
const documents = await retrieveSimilarDocuments(
  supabase,
  queryEmbedding,
  RETRIEVAL_LIMIT * 2, // Retrieve more for re-ranking
  SIMILARITY_THRESHOLD,
);

// Re-rank documents
const rerankedDocs = await rerankDocuments(
  lastMessage.content,
  documents,
  RETRIEVAL_LIMIT // Return top 5 after re-ranking
);
```

### 2.2 Multi-Query Retrieval

**File**: `web/src/lib/chatbot/multi-query.ts` (new)

```typescript
import type { OpenAI } from 'openai';

export async function generateQueryVariations(
  originalQuery: string,
  openai: OpenAI
): Promise<string[]> {
  try {
    const prompt = `You are a helpful assistant that generates search query variations.
    
Original query: "${originalQuery}"

Generate 2-3 different search queries that would help find relevant information.
Return ONLY a JSON array of strings, no other text.

Example: ["query variation 1", "query variation 2", "query variation 3"]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    const variations = parsed.queries || parsed.variations || [];
    
    // Return original query + variations
    return [originalQuery, ...variations].slice(0, 4);
  } catch (error) {
    console.warn('Failed to generate query variations:', error);
    return [originalQuery]; // Fallback to original query
  }
}
```

**File**: `web/src/app/api/chatbot/route.ts`

```typescript
import { generateQueryVariations } from '@/lib/chatbot/multi-query';

// Generate query variations
const queryVariations = await generateQueryVariations(
  lastMessage.content,
  openaiClient
);

// Retrieve documents for each variation
const allDocuments: RetrievedDocument[] = [];
for (const query of queryVariations) {
  const queryEmbedding = await generateQueryEmbedding(query, openaiClient);
  const docs = await retrieveSimilarDocuments(
    supabase,
    queryEmbedding,
    RETRIEVAL_LIMIT,
    SIMILARITY_THRESHOLD,
  );
  allDocuments.push(...docs);
}

// Deduplicate by document ID
const uniqueDocs = Array.from(
  new Map(allDocuments.map(doc => [doc.id, doc])).values()
);

// Re-rank and get top results
const rerankedDocs = await rerankDocuments(
  lastMessage.content,
  uniqueDocs,
  RETRIEVAL_LIMIT
);
```

---

## Phase 3: Performance & Monitoring (Week 5-6)

### 3.1 Add Response Caching

**File**: `web/src/lib/chatbot/cache.ts` (new)

```typescript
import { createHash } from 'crypto';
import type { RetrievedDocument } from './retrieval';

interface CachedResponse {
  queryHash: string;
  response: string;
  documents: RetrievedDocument[];
  createdAt: Date;
  expiresAt: Date;
}

const cache = new Map<string, CachedResponse>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function getQueryHash(query: string, embeddings: number[]): string {
  const combined = query + JSON.stringify(embeddings.slice(0, 10)); // Use first 10 dims for hash
  return createHash('sha256').update(combined).digest('hex');
}

export function getCachedResponse(queryHash: string): CachedResponse | null {
  const cached = cache.get(queryHash);
  if (!cached) return null;
  
  if (new Date() > cached.expiresAt) {
    cache.delete(queryHash);
    return null;
  }
  
  return cached;
}

export function setCachedResponse(
  queryHash: string,
  response: string,
  documents: RetrievedDocument[]
): void {
  cache.set(queryHash, {
    queryHash,
    response,
    documents,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + CACHE_TTL),
  });
  
  // Clean up old cache entries (simple LRU)
  if (cache.size > 1000) {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].expiresAt.getTime() - b[1].expiresAt.getTime());
    entries.slice(0, 100).forEach(([key]) => cache.delete(key));
  }
}
```

### 3.2 Add Analytics

**File**: `web/src/app/api/chatbot/analytics/route.ts` (new)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/app/lib/supabaseServiceRole';

export async function POST(req: NextRequest) {
  try {
    const { event, data } = await req.json();
    
    const supabase = supabaseServiceRole();
    await supabase.from('chatbot_analytics').insert({
      event_type: event,
      event_data: data,
      created_at: new Date().toISOString(),
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to log analytics' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = supabaseServiceRole();
    const { data } = await supabase
      .from('chatbot_analytics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
```

**File**: `web/src/app/api/chatbot/route.ts`

```typescript
// Track analytics
import { getQueryHash } from '@/lib/chatbot/cache';

// After processing query
const queryHash = getQueryHash(lastMessage.content, queryEmbedding);

// Log analytics
await fetch('/api/chatbot/analytics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event: 'query_processed',
    data: {
      queryLength: lastMessage.content.length,
      documentCount: documents.length,
      responseTime: Date.now() - startTime,
    },
  }),
}).catch(console.error);
```

---

## Phase 4: Advanced Features (Week 7-8)

### 4.1 Conversation Summarization

**File**: `web/src/lib/chatbot/summarization.ts` (new)

```typescript
import type { OpenAI } from 'openai';

export async function summarizeConversation(
  messages: Array<{ role: string; content: string }>,
  openai: OpenAI
): Promise<string> {
  if (messages.length <= 10) {
    return ''; // No need to summarize short conversations
  }
  
  const oldMessages = messages.slice(0, -10);
  const recentMessages = messages.slice(-10);
  
  const prompt = `Summarize the following conversation in 2-3 sentences, focusing on key topics and user intent:

${oldMessages.map(m => `${m.role}: ${m.content}`).join('\n')}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 150,
    temperature: 0.3,
  });
  
  return response.choices[0]?.message?.content || '';
}
```

### 4.2 Improved Chunking Strategy

**File**: `web/src/lib/chatbot/chunking.ts`

```typescript
// Add hierarchical chunking
export function chunkMarkdownHierarchical(
  content: string,
  sourcePath: string,
  maxChunkSize: number = 1000,
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  
  // Split by top-level headings (##)
  const topLevelSections = content.split(/^(##\s+.+)$/gm);
  
  for (let i = 0; i < topLevelSections.length; i += 2) {
    const heading = topLevelSections[i]?.replace(/^##\s+/, '') || '';
    const sectionContent = topLevelSections[i + 1] || '';
    
    if (!sectionContent.trim()) continue;
    
    // If section is small, keep as one chunk
    if (estimateTokens(sectionContent) <= maxChunkSize) {
      chunks.push({
        content: sectionContent.trim(),
        metadata: {
          sourcePath,
          chunkIndex: chunks.length,
          heading,
        },
      });
    } else {
      // Split large sections by subheadings (###)
      const subSections = sectionContent.split(/^(###\s+.+)$/gm);
      // ... process sub-sections
    }
  }
  
  return chunks;
}
```

---

## Database Migrations

### Migration: Add Feedback Table

```sql
-- web/supabase/migrations/YYYYMMDDHHMMSS_add_chatbot_feedback.sql
create table if not exists public.chatbot_feedback (
  id uuid primary key default gen_random_uuid(),
  message_id text not null,
  feedback_type text not null check (feedback_type in ('up', 'down')),
  comment text,
  created_at timestamp with time zone not null default timezone('utc', now())
);

create index if not exists idx_chatbot_feedback_message_id 
  on public.chatbot_feedback(message_id);
create index if not exists idx_chatbot_feedback_created_at 
  on public.chatbot_feedback(created_at);
```

### Migration: Add Analytics Table

```sql
-- web/supabase/migrations/YYYYMMDDHHMMSS_add_chatbot_analytics.sql
create table if not exists public.chatbot_analytics (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  event_data jsonb default '{}',
  created_at timestamp with time zone not null default timezone('utc', now())
);

create index if not exists idx_chatbot_analytics_event_type 
  on public.chatbot_analytics(event_type);
create index if not exists idx_chatbot_analytics_created_at 
  on public.chatbot_analytics(created_at);
```

---

## Testing Checklist

### Unit Tests
- [ ] Query re-ranking function
- [ ] Multi-query generation
- [ ] Cache hit/miss logic
- [ ] Conversation summarization

### Integration Tests
- [ ] End-to-end chat flow
- [ ] Feedback submission
- [ ] Analytics tracking
- [ ] Error handling

### Performance Tests
- [ ] Response time under load
- [ ] Cache effectiveness
- [ ] Memory usage
- [ ] Token usage optimization

---

## Monitoring Dashboard

### Key Metrics to Display

1. **Response Quality**
   - Average satisfaction score
   - Positive/negative feedback ratio
   - Response relevance (manual evaluation)

2. **Performance**
   - Average response time
   - P95/P99 response time
   - Token usage per query
   - Cache hit rate

3. **Usage**
   - Queries per day/week/month
   - Unique users
   - Popular questions
   - Conversation length distribution

4. **Reliability**
   - Error rate
   - Uptime percentage
   - Rate limit hits
   - API failures

---

## Next Steps

1. **Review** the comparison document (`CHATBOT_INDUSTRY_BEST_PRACTICES_2025.md`)
2. **Prioritize** features based on your needs
3. **Implement** Phase 1 quick wins first
4. **Measure** improvements with analytics
5. **Iterate** based on user feedback

---

**Last Updated**: January 2025

