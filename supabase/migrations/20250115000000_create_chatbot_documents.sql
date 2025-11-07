-- Migration: Enable pgvector extension and create chatbot_documents table
-- This enables vector similarity search for RAG (Retrieval Augmented Generation)
-- The table stores document chunks with embeddings for semantic search

-- Enable pgvector extension (idempotent)
create extension if not exists vector;

-- Create chatbot_documents table
create table if not exists public.chatbot_documents (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(1536) not null, -- OpenAI text-embedding-3-small dimension
  metadata jsonb default '{}',
  source_path text not null,
  chunk_index integer not null default 0,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

comment on table public.chatbot_documents is 'Document chunks with embeddings for chatbot RAG (Retrieval Augmented Generation).';
comment on column public.chatbot_documents.content is 'Text content of the document chunk.';
comment on column public.chatbot_documents.embedding is 'Vector embedding generated from content using OpenAI embeddings.';
comment on column public.chatbot_documents.metadata is 'Additional metadata about the document (title, section, etc.).';
comment on column public.chatbot_documents.source_path is 'Path to the source document file (e.g., "docs/ARCHITECTURE.md").';
comment on column public.chatbot_documents.chunk_index is 'Index of this chunk within the source document (0-based).';

-- Create indexes for efficient queries
create index if not exists idx_chatbot_documents_source_path 
  on public.chatbot_documents(source_path);

create index if not exists idx_chatbot_documents_created_at 
  on public.chatbot_documents(created_at);

-- Create vector similarity search index (IVFFlat for approximate nearest neighbor)
-- This index is optimized for cosine similarity search
-- Note: IVFFlat index requires at least some data, so we'll create it after ingestion
-- For now, we'll create it conditionally
do $$
begin
  -- Only create index if we have data (pgvector requirement)
  if exists (select 1 from public.chatbot_documents limit 1) then
    -- Drop existing index if it exists
    drop index if exists idx_chatbot_documents_embedding_vector_cosine;
    
    -- Create IVFFlat index for cosine similarity
    -- Using 100 lists (good for up to ~1M vectors)
    create index idx_chatbot_documents_embedding_vector_cosine
      on public.chatbot_documents
      using ivfflat (embedding vector_cosine_ops)
      with (lists = 100);
  end if;
end
$$;

-- Helper trigger to keep updated_at current
create or replace function public.handle_chatbot_documents_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists set_updated_at on public.chatbot_documents;
create trigger set_updated_at
before update on public.chatbot_documents
for each row
execute function public.handle_chatbot_documents_updated_at();

-- Enable RLS (Row Level Security)
alter table public.chatbot_documents enable row level security;

-- Policy: Public read access (chatbot documents are public knowledge base)
-- Anyone can read documents for chatbot queries
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chatbot_documents'
      and policyname = 'Public can read chatbot documents'
  ) then
    create policy "Public can read chatbot documents"
      on public.chatbot_documents
      for select
      to anon, authenticated
      using (true);
  end if;
end
$$;

-- Policy: Only service role can insert/update/delete
-- Document ingestion is done server-side with service role
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'chatbot_documents'
      and policyname = 'Service role can manage chatbot documents'
  ) then
    create policy "Service role can manage chatbot documents"
      on public.chatbot_documents
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end
$$;

-- Create function to rebuild vector index after bulk inserts
-- This should be called after ingesting large amounts of documents
create or replace function public.rebuild_chatbot_documents_vector_index()
returns void
language plpgsql
security definer
as $$
begin
  -- Drop existing index
  drop index if exists idx_chatbot_documents_embedding_vector_cosine;
  
  -- Recreate index with optimal settings
  -- Adjust lists parameter based on data size: lists = rows / 1000 (min 10, max 1000)
  execute format(
    'create index idx_chatbot_documents_embedding_vector_cosine
     on public.chatbot_documents
     using ivfflat (embedding vector_cosine_ops)
     with (lists = %s)',
    greatest(10, least(1000, (select count(*)::integer / 1000 from public.chatbot_documents)))
  );
end;
$$;

comment on function public.rebuild_chatbot_documents_vector_index() is 
  'Rebuilds the vector similarity search index with optimal settings based on current data size. Call this after bulk document ingestion.';

-- Create RPC function for vector similarity search
-- This function is optimized for pgvector cosine similarity search
create or replace function public.match_chatbot_documents(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  source_path text,
  chunk_index integer,
  similarity float
)
language plpgsql
security definer
as $$
begin
  return query
  select
    chatbot_documents.id,
    chatbot_documents.content,
    chatbot_documents.metadata,
    chatbot_documents.source_path,
    chatbot_documents.chunk_index,
    1 - (chatbot_documents.embedding <=> query_embedding) as similarity
  from public.chatbot_documents
  where 1 - (chatbot_documents.embedding <=> query_embedding) > match_threshold
  order by chatbot_documents.embedding <=> query_embedding
  limit match_count;
end;
$$;

comment on function public.match_chatbot_documents(vector, float, int) is 
  'Performs vector similarity search on chatbot documents using cosine distance. Returns documents with similarity above threshold, ordered by relevance.';

