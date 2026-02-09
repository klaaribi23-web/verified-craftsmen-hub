CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.schedule(
  'bulk-sync-artisan-media-auto',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://cstxrauedasufcecaouq.supabase.co/functions/v1/bulk-sync-artisan-media',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzdHhyYXVlZGFzdWZjZWNhb3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTY2NjUsImV4cCI6MjA4NTk3MjY2NX0.sV48PFBLYtBXIzylcabUydt2Fwqbjqwu276WizLa7L0"}'::jsonb,
    body := '{"offset": 0, "limit": 10}'::jsonb
  ) AS request_id;
  $$
);
