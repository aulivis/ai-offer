# Chatbot Knowledge Base Setup

## Overview

This document describes how to set up the public knowledge base for the Vyndi chatbot.

## Public Knowledge Base

The public knowledge base (`docs/chatbot/public-knowledge-base.md`) contains ONLY public information that users should know:
- Subscription plans and pricing
- How to create offers (step-by-step guide)
- Available templates
- API usage and endpoints
- Features and functionality
- FAQ

**Important:** This knowledge base does NOT contain:
- Internal architecture details
- Implementation details
- Technical implementation specifics
- Internal code structure
- Development workflows

## Ingesting the Knowledge Base

### Prerequisites

1. Ensure you have the required environment variables in `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   ```

2. Ensure the `chatbot_documents` table exists in Supabase (created by migrations)

### Running the Ingestion Script

```bash
# From the web directory
npm run ingest-chatbot-knowledge-base
```

Or directly:
```bash
ts-node scripts/ingest-chatbot-knowledge-base.ts
```

### What the Script Does

1. Reads `docs/chatbot/public-knowledge-base.md`
2. Chunks the document intelligently (respecting headings and sections)
3. Generates embeddings for each chunk using OpenAI
4. Stores chunks and embeddings in the `chatbot_documents` table
5. Deletes existing documents with the same source path (allows re-ingestion)

### Rebuilding the Vector Index

After ingestion, you may want to rebuild the vector index for better performance:

```sql
SELECT rebuild_chatbot_documents_vector_index();
```

(Only if the function exists in your Supabase database)

## Predefined Questions and Answers

The chatbot is configured to answer the following predefined questions:

### 1. "Milyen csomagok vannak?" (What packages are available?)
**Expected Answer:** Information about Free, Standard, and Pro plans with pricing and features.

### 2. "Hogyan tudok ajánlatot készíteni?" (How can I create an offer?)
**Expected Answer:** Step-by-step guide on creating an offer using the 3-step wizard.

### 3. "Milyen sablonok elérhetők?" (What templates are available?)
**Expected Answer:** Information about free and premium templates, and which plan includes them.

### 4. "Hogyan használhatom az API-t?" (How can I use the API?)
**Expected Answer:** API documentation including authentication, endpoints, and usage examples.

### 5. "Mennyibe kerül a szolgáltatás?" (How much does the service cost?)
**Expected Answer:** Pricing information for all plans.

## Testing

After ingesting the knowledge base, test the chatbot:

1. Open the chatbot in the application
2. Click on a predefined question
3. Verify that the chatbot provides a helpful, accurate answer
4. Test with custom questions as well

## Updating the Knowledge Base

To update the knowledge base:

1. Edit `docs/chatbot/public-knowledge-base.md`
2. Run the ingestion script again:
   ```bash
   npm run ingest-chatbot-knowledge-base
   ```
3. The script will automatically delete old documents and ingest new ones

## Troubleshooting

### No Documents Found
If the chatbot returns "No documents found" for queries:
1. Check if the knowledge base was ingested successfully
2. Verify the `chatbot_documents` table has data:
   ```sql
   SELECT COUNT(*) FROM chatbot_documents;
   ```
3. Check if embeddings were generated correctly
4. Verify the similarity threshold (default: 0.7) - try lowering it if needed

### Poor Quality Answers
If answers are not accurate or helpful:
1. Review the knowledge base content - ensure it's comprehensive and accurate
2. Check chunk sizes - larger chunks may provide more context
3. Verify embeddings are working correctly
4. Consider adjusting the similarity threshold

### Embedding Generation Errors
If embedding generation fails:
1. Verify `OPENAI_API_KEY` is set correctly
2. Check OpenAI API rate limits
3. Verify the OpenAI API is accessible
4. Check for network issues

## Best Practices

1. **Keep it Public:** Only include information that users should know
2. **Be Comprehensive:** Cover all common questions and use cases
3. **Keep it Updated:** Update the knowledge base when features change
4. **Test Regularly:** Test the chatbot after each update
5. **Monitor Feedback:** Use chatbot feedback to improve the knowledge base

## Related Documentation

- `CHATBOT_REDESIGN_2025.md` - Chatbot architecture and design
- `CHATBOT_SINGLE_ENDPOINT_IMPLEMENTATION.md` - API implementation
- `public-knowledge-base.md` - The actual knowledge base content


