-- Best lap times per series per week, accumulated over time.
-- Upsert key: (season_id, series_id, race_week_num) — one row per series per week, never overwritten.

create table if not exists series_best_laps (
  season_id         integer      not null,
  series_id         integer      not null,
  series_name       text         not null,
  race_week_num     integer      not null, -- 0-indexed (week 1 of season = 0)
  track_id          integer,
  track_name        text,
  config_name       text,                  -- track configuration name (e.g. "Full Course")
  best_lap_time     integer,               -- tenths of milliseconds (divide by 10000 for seconds)
  best_cust_id      integer,               -- customer_id of the driver who set the best lap
  best_display_name text,                  -- display name of that driver
  event_type        integer      not null, -- 4=race, 5=time trial
  synced_at         timestamptz  not null default now(),

  primary key (season_id, series_id, race_week_num)
);

-- RLS: public read, no direct writes (only service role via Edge Function)
alter table series_best_laps enable row level security;
create policy "public read" on series_best_laps for select using (true);

-- Sync run log for debugging and monitoring.
create table if not exists sync_log (
  id           bigint generated always as identity primary key,
  ran_at       timestamptz not null default now(),
  success      boolean     not null,
  series_count integer,                -- how many series were processed
  error_msg    text,
  duration_ms  integer
);

-- sync_log is internal only — no public access
alter table sync_log enable row level security;
