# Supabase Backend Setup — iRacing Schedule

## What this backend does
A Supabase Edge Function (`iracing-sync`) runs on a cron schedule, authenticates with the iRacing API, fetches the **best lap time per series for the current race week**, and upserts it into Supabase. Data accumulates week over week — old weeks are never overwritten.

---

## Current Status: BLOCKED on OAuth client credentials

iRacing migrated their auth to OAuth2. The old `/auth` endpoint is gone (returns 405).  
The new flow requires a registered `client_id` + `client_secret` from iRacing.  
**Client registration is currently paused** while iRacing evaluates 3rd party API usage.

### What to do when you have credentials
Once you have a `client_id` and `client_secret`, implement the Edge Function auth using the **Password Limited OAuth2 flow** (see spec below), then set the secrets and deploy.

---

## OAuth2 Implementation Spec (ready to code)

### Endpoint
```
POST https://oauth.iracing.com/oauth2/token
Content-Type: application/x-www-form-urlencoded
```

### Request body
```
grant_type=password_limited
&client_id=<your-client-id>
&client_secret=<masked-client-secret>
&username=<iracing-email>
&password=<masked-password>
&scope=iracing.auth
```

### Masking algorithm (same for both client_secret and password)
```
SHA-256(secret + identifier.toLowerCase()) → base64
```
- For `client_secret`: identifier = `client_id`
- For `password`: identifier = `username` (email)

### Token response
```json
{
  "access_token": "...",   // use as Bearer token, expires in 600s
  "token_type": "Bearer",
  "expires_in": 600,
  "refresh_token": "...",  // single-use, expires in 7 days
  "refresh_token_expires_in": 604800
}
```

### Using the token
All calls to `https://members-ng.iracing.com/data/...` need:
```
Authorization: Bearer <access_token>
```

### Refresh flow
When the access token expires (~590s), call `/token` again with:
```
grant_type=refresh_token
&client_id=<client-id>
&client_secret=<masked-client-secret>
&refresh_token=<previous-refresh-token>
```
Store the new refresh token (single-use — the old one is invalidated).

---

## Data fetched

**Best lap time per series, current race week only.**  
Each sync upserts one row per series. Old weeks are preserved (upsert key is `season_id + series_id + race_week_num`).

Fetch flow:
1. `GET /data/series/seasons?include_series=1` — get all active seasons + current `race_week_num`
2. For each season: `GET /data/results/search_series?season_id=X&race_week_num=Y&event_types=5` (time trial; fallback to `event_types=4` for race)
3. Results come via S3 link (`response.link`) — fetch that URL for the actual data array
4. Find min `best_lap_time` across all entries (value is in tenths of milliseconds, ÷10000 = seconds)

---

## Files

| File | Purpose |
|---|---|
| `supabase/functions/iracing-sync/index.ts` | Edge Function (auth + fetch + upsert) |
| `supabase/migrations/20260403000000_init.sql` | DB schema: `series_best_laps` + `sync_log` tables |
| `supabase/migrations/20260403000001_cron.sql` | pg_cron job: fires Edge Function every hour |
| `supabase/config.toml` | Supabase project config |

---

## DB Schema

```sql
series_best_laps (
  season_id         integer,
  series_id         integer,
  series_name       text,
  race_week_num     integer,   -- 0-indexed
  track_id          integer,
  track_name        text,
  config_name       text,
  best_lap_time     integer,   -- tenths of ms (÷10000 = seconds)
  best_cust_id      integer,
  best_display_name text,
  event_type        integer,   -- 4=race, 5=time trial
  synced_at         timestamptz,
  PRIMARY KEY (season_id, series_id, race_week_num)
)
```

---

## Secrets needed in Supabase

```bash
supabase secrets set IRACING_EMAIL=you@email.com
supabase secrets set IRACING_PASSWORD=yourpassword
supabase secrets set IRACING_CLIENT_ID=<from-iracing>
supabase secrets set IRACING_CLIENT_SECRET=<from-iracing>
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

---

## Deployment commands

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
supabase functions deploy iracing-sync
```

## Verify cron is registered
```sql
select * from cron.job;
select * from cron.job_run_details order by start_time desc limit 10;
select * from sync_log order by ran_at desc limit 10;
```

---

## How to get OAuth credentials
Contact iRacing to request OAuth client credentials:  
https://support.iracing.com/support/solutions/articles/31000177790-oauth-client-credentials

Use case to describe: **server-side cron job, password_limited flow, 1 user (yourself).**
