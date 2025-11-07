-- Rebuild vector index for optimal performance
-- Run this in Supabase SQL Editor after ingesting documents

SELECT rebuild_chatbot_documents_vector_index();

-- Verify the index was created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'chatbot_documents'
  AND indexname LIKE '%vector%';

