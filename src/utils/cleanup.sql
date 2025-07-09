-- Helper function to cleanup old chunks
create or replace function cleanup_old_chunks()
returns void
language sql
as $$
  delete from document_chunks 
  where created_at < now() - interval '24 hours';
$$;

-- Enable the pg_cron extension
create extension if not exists pg_cron;

-- Run cleanup every day at 2 AM
select cron.schedule('cleanup-chunks', '0 2 * * *', 'select cleanup_old_chunks();');