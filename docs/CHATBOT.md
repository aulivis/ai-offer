# Chatbot Documentation

## Overview

The Vyndi chatbot is an AI-powered assistant that helps users with questions about the platform, features, and usage. It uses vector embeddings, semantic search, and OpenAI GPT models to provide accurate, contextual answers.

## Features

- **Source Citations**: Clickable links to source documents
- **User Feedback**: Thumbs up/down for responses
- **Multi-Query Retrieval**: Generates query variations for better recall
- **Query Re-ranking**: Improves relevance of retrieved documents
- **Conversation Summarization**: Reduces token usage for long conversations
- **Analytics Tracking**: Monitors usage and performance
- **Accessibility**: Full keyboard navigation and screen reader support

## Quick Start

### 1. Database Migrations

Apply the migrations to create feedback and analytics tables:

```bash
supabase migration up
```

Migrations:
- `20250130000000_create_chatbot_feedback.sql`
- `20250130000001_create_chatbot_analytics.sql`

### 2. Knowledge Base Setup

Ingest the public knowledge base:

```bash
npm run ingest-chatbot-knowledge-base
```

This processes `docs/chatbot/public-knowledge-base.md` and stores it in the vector database.

### 3. Configuration

Enable/disable features in `web/src/app/api/chat/route.ts`:

```typescript
const ENABLE_MULTI_QUERY = true;      // Multi-query retrieval
const ENABLE_RERANKING = true;        // Query re-ranking
const ENABLE_SUMMARIZATION = true;    // Conversation summarization
const ENABLE_CACHING = false;         // Response caching (disabled for streaming)
```

### 4. Testing

Test the chatbot:
1. Ask a question in the chatbot UI
2. Verify source citations appear as clickable links
3. Test feedback buttons (thumbs up/down)
4. Check server logs for multi-query and re-ranking

## API Endpoints

### POST /api/chat

Main chatbot endpoint for processing queries.

**Request:**
```json
{
  "message": "Milyen csomagok vannak?",
  "conversationId": "optional-conversation-id",
  "history": []
}
```

**Response:** Server-Sent Events stream
```
data: {"type":"delta","content":"Free, Standard, and Pro..."}
data: {"type":"done","sources":[...]}
```

### POST /api/chat/feedback

Submit feedback for a response.

**Request:**
```json
{
  "messageId": "message-id",
  "feedbackType": "up" | "down",
  "conversationId": "conversation-id"
}
```

### GET /api/chat/analytics

Get analytics statistics.

**Response:**
```json
{
  "totalQueries": 1000,
  "averageResponseTime": 2.5,
  "satisfactionRate": 0.85,
  "errorRate": 0.02
}
```

## Knowledge Base

### Public Knowledge Base

The public knowledge base (`docs/chatbot/public-knowledge-base.md`) contains:
- Subscription plans and pricing
- How to create offers
- Available templates
- API usage and endpoints
- Features and functionality
- FAQ

**Important:** This knowledge base does NOT contain internal implementation details.

### Ingesting Documents

```bash
# Ingest public knowledge base
npm run ingest-chatbot-knowledge-base

# Or ingest custom documents
npm run ingest-docs -- path/to/document.md
```

### Rebuilding Vector Index

After ingestion, rebuild the vector index:

```sql
SELECT rebuild_chatbot_documents_vector_index();
```

## Configuration

### Feature Flags

All features can be toggled via constants in `route.ts`:

```typescript
const ENABLE_MULTI_QUERY = true;      // Multi-query retrieval
const ENABLE_RERANKING = true;        // Query re-ranking
const ENABLE_SUMMARIZATION = true;    // Conversation summarization
const ENABLE_CACHING = false;         // Response caching
```

### Thresholds

```typescript
const MAX_MESSAGES = 20;                      // Max messages in context
const RETRIEVAL_LIMIT = 5;                    // Documents after re-ranking
const RETRIEVAL_LIMIT_BEFORE_RERANK = 10;     // Documents before re-ranking
const SIMILARITY_THRESHOLD = 0.7;             // Minimum similarity score (0-1)
```

## Monitoring

### Analytics

The chatbot tracks:
- Query processing time
- Token usage per query
- Document count retrieved
- Cache hit rate (when enabled)
- User feedback (thumbs up/down)
- Error rates and types

### Database Queries

```sql
-- View recent feedback
SELECT * FROM chatbot_feedback 
ORDER BY created_at DESC 
LIMIT 10;

-- View analytics events
SELECT * FROM chatbot_analytics 
WHERE event_type = 'query_processed'
ORDER BY created_at DESC 
LIMIT 10;

-- Calculate satisfaction rate
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN feedback_type = 'up' THEN 1 ELSE 0 END) as up,
  SUM(CASE WHEN feedback_type = 'down' THEN 1 ELSE 0 END) as down,
  ROUND(100.0 * SUM(CASE WHEN feedback_type = 'up' THEN 1 ELSE 0 END) / COUNT(*), 2) as satisfaction_rate
FROM chatbot_feedback;
```

## Troubleshooting

### Issue: Source links not working
**Solution**: Check if markdown link format is correct. Links should be in format `[text](url)`.

### Issue: Feedback not saving
**Solution**: 
1. Check database migrations are applied
2. Check RLS policies are correct
3. Check browser console for errors
4. Verify `/api/chat/feedback` endpoint is accessible

### Issue: Multi-query not working
**Solution**:
1. Check `ENABLE_MULTI_QUERY` is set to `true`
2. Check server logs for errors
3. Verify OpenAI API key is valid
4. Check if query variations are being generated

### Issue: Re-ranking not working
**Solution**:
1. Check `ENABLE_RERANKING` is set to `true`
2. Verify enough documents are retrieved (need more than RETRIEVAL_LIMIT)
3. Check server logs for re-ranking errors

### Issue: Analytics not tracking
**Solution**:
1. Check database migrations are applied
2. Verify `/api/chat/analytics` endpoint is accessible
3. Check server logs for analytics errors
4. Verify RLS policies allow public insert

## Architecture

### Components

1. **Retrieval** (`src/lib/chatbot/retrieval.ts`)
   - Vector similarity search
   - Source citation formatting
   - Markdown link parsing

2. **Multi-Query** (`src/lib/chatbot/multi-query.ts`)
   - Query variation generation
   - Parallel query processing
   - Result deduplication

3. **Re-ranking** (`src/lib/chatbot/reranking.ts`)
   - Document re-ranking
   - Similarity + term overlap scoring
   - Top-K selection

4. **Summarization** (`src/lib/chatbot/summarization.ts`)
   - Conversation summarization
   - Token estimation
   - Context window management

5. **Cache** (`src/lib/chatbot/cache.ts`)
   - In-memory response caching
   - LRU eviction
   - Semantic similarity keys

### Data Flow

1. User sends message
2. Generate query variations (if enabled)
3. Retrieve documents from vector database
4. Re-rank documents (if enabled)
5. Build context with conversation history
6. Summarize older messages if needed (if enabled)
7. Generate response with OpenAI
8. Format sources and return stream
9. Track analytics

## Future Enhancements

### Planned Improvements

1. **Advanced Re-ranking**
   - Integrate cross-encoder model
   - Use `cross-encoder-ms-marco-MiniLM-L-6-v2`

2. **Response Caching**
   - Implement streaming response caching
   - Use Redis for distributed caching

3. **Hybrid Search**
   - Add keyword search (BM25) alongside vector search
   - Combine semantic + keyword search results

4. **Analytics Dashboard**
   - Create admin dashboard for analytics
   - Visualize metrics
   - Export data for analysis

## Additional Resources

- [Knowledge Base Setup](./CHATBOT.md#knowledge-base)
- [Predefined Questions](./CHATBOT_PREDEFINED_QUESTIONS_ANSWERS.md) - Expected answers for predefined questions
- [API Documentation](./API.md)
- [Architecture Documentation](./ARCHITECTURE.md)

