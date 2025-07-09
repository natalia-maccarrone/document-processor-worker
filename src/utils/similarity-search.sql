create or replace function match_chunks (
 query_embedding vector(384),
 match_threshold float,
 match_count int,
 doc_id uuid
)
returns table (
 id uuid,
 document_id uuid,
 chunk_text text,
 similarity float
)
language sql stable
as $$
select
 document_chunks.id,
 document_chunks.document_id,
 document_chunks.chunk_text,
 1 - (document_chunks.embedding <=> query_embedding) as similarity
from document_chunks
where document_chunks.document_id = doc_id
  and 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
order by similarity desc
limit match_count;
$$;