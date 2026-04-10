-- Enable required extensions
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Schedule the iracing-sync Edge Function to run every hour
select cron.schedule(
  'iracing-sync-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url     := current_setting('app.settings.edge_function_url') || '/iracing-sync',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body    := '{}'::jsonb
  );
  $$
);
