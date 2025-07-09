-- Enable vector extension
create extension if not exists vector;

-- Create table
create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null,
  chunk_text text not null,
  embedding vector(384),
  chunk_index integer,
  created_at timestamp default now()
);

-- Create index for fast similarity search
create index on document_chunks using ivfflat (embedding vector_cosine_ops);