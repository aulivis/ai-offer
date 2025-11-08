# Chatbot Quick Start Guide

## 🚀 Getting Started

All improvements have been implemented! Here's what you need to do to use them:

### 1. Run Database Migrations

Apply the new migrations to create feedback and analytics tables:

```bash
# If using Supabase CLI
supabase migration up

# Or apply migrations manually in Supabase dashboard
# Files: 
# - 20250130000000_create_chatbot_feedback.sql
# - 20250130000001_create_chatbot_analytics.sql
```

### 2. Restart Development Server

```bash
cd web
npm run dev
```

### 3. Test the Features

#### Test Source Citations
1. Ask a question in the chatbot
2. Check if sources appear as clickable links in the response
3. Click on a source link to verify it works

#### Test User Feedback
1. Ask a question and get a response
2. Click thumbs up (👍) or thumbs down (👎) on the response
3. Check browser console for any errors
4. Verify feedback is stored (check database or use GET /api/chatbot/feedback)

#### Test Multi-Query Retrieval
1. Ask an ambiguous question (e.g., "Hogyan működik?")
2. Check server logs for "Generated query variations"
3. Verify better retrieval results

#### Test Query Re-ranking
1. Ask a question
2. Check server logs for "Re-ranking documents"
3. Verify improved relevance of results

#### Test Conversation Summarization
1. Have a long conversation (20+ messages)
2. Check server logs for "Summarizing conversation"
3. Verify context is maintained with fewer tokens

### 4. View Analytics

```bash
# Get analytics statistics
curl http://localhost:3000/api/chatbot/analytics

# Get feedback statistics
curl http://localhost:3000/api/chatbot/feedback
```

---

## 🎛️ Configuration

### Enable/Disable Features

Edit `web/src/app/api/chatbot/route.ts`:

```typescript
const ENABLE_MULTI_QUERY = true;      // Enable multi-query retrieval
const ENABLE_RERANKING = true;        // Enable query re-ranking
const ENABLE_SUMMARIZATION = true;    // Enable conversation summarization
const ENABLE_CACHING = false;         // Enable response caching (disabled for streaming)
```

### Adjust Thresholds

```typescript
const MAX_MESSAGES = 20;                      // Max messages in context
const RETRIEVAL_LIMIT = 5;                    // Documents after re-ranking
const RETRIEVAL_LIMIT_BEFORE_RERANK = 10;     // Documents before re-ranking
const SIMILARITY_THRESHOLD = 0.7;             // Minimum similarity score (0-1)
```

---

## 📊 Monitoring

### Check Logs

The chatbot now logs extensively. Check your server logs for:
- Query processing time
- Document retrieval count
- Re-ranking results
- Conversation summarization
- Errors and warnings

### Analytics Endpoints

- `GET /api/chatbot/analytics` - View analytics statistics
- `GET /api/chatbot/feedback` - View feedback statistics

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

---

## 🐛 Troubleshooting

### Issue: Source links not working
**Solution**: Check if markdown link format is correct. Links should be in format `[text](url)`.

### Issue: Feedback not saving
**Solution**: 
1. Check database migrations are applied
2. Check RLS policies are correct
3. Check browser console for errors
4. Verify `/api/chatbot/feedback` endpoint is accessible

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
2. Verify `/api/chatbot/analytics` endpoint is accessible
3. Check server logs for analytics errors
4. Verify RLS policies allow public insert

---

## 🔍 Verification Checklist

- [ ] Database migrations applied successfully
- [ ] Feedback table exists and has RLS policies
- [ ] Analytics table exists and has RLS policies
- [ ] Source citations appear as clickable links
- [ ] Feedback buttons appear on assistant messages
- [ ] Feedback is saved to database
- [ ] Analytics events are logged
- [ ] Multi-query retrieval works (check logs)
- [ ] Query re-ranking works (check logs)
- [ ] Conversation summarization works (for long conversations)
- [ ] Error messages are user-friendly
- [ ] Accessibility features work (keyboard navigation, screen reader)

---

## 📚 Additional Resources

- [Industry Best Practices](./CHATBOT_INDUSTRY_BEST_PRACTICES_2025.md)
- [Implementation Roadmap](./CHATBOT_IMPLEMENTATION_ROADMAP.md)
- [Implementation Summary](./CHATBOT_IMPLEMENTATION_SUMMARY.md)

---

**Last Updated**: January 2025

