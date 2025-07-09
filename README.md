# Document Processor Worker

A Cloudflare Worker that processes documents by chunking them into smaller pieces and generating vector embeddings for semantic search and retrieval. This worker integrates with an embeddings service and stores chunks in a Supabase database with pgvector support.

## Architecture

```
Document Input → Text Chunking → Embedding Generation → Vector Storage
                      ↓                ↓                    ↓
              LangChain Splitter  Embeddings Worker    Supabase + pgvector
```

## Prerequisites

- Node.js 18 or higher
- Cloudflare Workers account
- Supabase account with pgvector extension enabled
- Access to an embeddings worker service

## Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd document-processor-worker
npm install
```

### 2. Database Setup

Set up your Supabase database by running the SQL scripts:

```sql
-- Run src/utils/create-table.sql to create the database schema
-- Run src/utils/similarity-search.sql to create the search function
```

### 3. Environment Configuration

Configure your environment variables in `wrangler.jsonc`:

```json
{
	"vars": {
		"SUPABASE_URL": "your-supabase-url"
	}
}
```

Add secrets using Wrangler CLI:

```bash
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put HF_TOKEN
```

### 4. Service Bindings

Configure the embeddings worker binding in `wrangler.jsonc`:

```json
{
	"services": [
		{
			"binding": "EMBEDDINGS_WORKER",
			"service": "embeddings-worker"
		}
	]
}
```

## API Reference

### POST /

Process a document and store its chunks with embeddings.

#### Request Body

```json
{
	"document": "Your document text content here..."
}
```

#### Response

**Success (200)**

```json
{
	"success": true,
	"document_id": "uuid-v4-string",
	"chunks_processed": 15
}
```

**Error (500)**

```json
{
	"error": "Error message describing what went wrong"
}
```

## Configuration

### Database Schema

The `document_chunks` table schema:

```sql
create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null,
  chunk_text text not null,
  embedding vector(384),  -- 384-dimensional embeddings
  chunk_index integer,
  created_at timestamp default now()
);
```

## Development

### Local Development

```bash
# Start development server
npm run dev

# Generate TypeScript types
npm run cf-typegen
```

### Testing

The project uses Vitest with Cloudflare Workers testing utilities:

```bash
npm test
```

### Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

## Dependencies

### Runtime Dependencies

- `@langchain/core`: Core LangChain functionality
- `@langchain/textsplitters`: Text splitting utilities
- `@supabase/supabase-js`: Supabase client library

### Development Dependencies

- `@cloudflare/vitest-pool-workers`: Vitest integration for Workers
- `typescript`: TypeScript compiler
- `vitest`: Testing framework
- `wrangler`: Cloudflare Workers CLI

## Database Functions

### Similarity Search

The worker includes a PostgreSQL function for similarity search:

```sql
create or replace function match_chunks (
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  doc_id uuid
)
```

This function can be used to find similar chunks based on cosine similarity.

## Environment Variables

| Variable               | Description                                 | Required                      |
| ---------------------- | ------------------------------------------- | ----------------------------- |
| `SUPABASE_URL`         | Your Supabase project URL                   | Yes                           |
| `SUPABASE_SERVICE_KEY` | Supabase service role key                   | Yes                           |
| `HF_TOKEN`             | Hugging Face token (if using HF embeddings) | Depends on embeddings service |
