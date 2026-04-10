import { createClient } from "jsr:@supabase/supabase-js@2";

const IRACING_BASE = "https://members-ng.iracing.com";
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ─── Auth ────────────────────────────────────────────────────────────────────

function collectCookies(resp: Response): string {
  const setCookies = resp.headers.getSetCookie?.() ?? [resp.headers.get("set-cookie") ?? ""];
  return setCookies.map((c) => c.split(";")[0].trim()).filter(Boolean).join("; ");
}

async function getAuthCookie(email: string, password: string): Promise<string> {
  // iRacing requires SHA-256(password + email.toLowerCase()) encoded as base64
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(password + email.toLowerCase()));
  const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));

  // Step 1: Hit members-ng to initiate OAuth flow → get redirect to oauth.iracing.com with req_id
  const initResp = await fetch(`${IRACING_BASE}/`, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "manual",
  });

  const oauthUrl = initResp.headers.get("location");
  if (!oauthUrl) throw new Error(`Expected OAuth redirect from members-ng, got ${initResp.status}`);

  const reqIdMatch = oauthUrl.match(/req_id=([^&]+)/);
  if (!reqIdMatch) throw new Error(`Could not find req_id in OAuth URL: ${oauthUrl}`);
  const reqId = reqIdMatch[1];

  // Step 2: Load the OAuth login page to get its cookies
  const oauthPageResp = await fetch(oauthUrl, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "manual",
  });
  const oauthCookies = collectCookies(oauthPageResp);

  // Step 3: POST credentials (form-encoded, not JSON)
  const loginUrl = `https://oauth.iracing.com/u/start?req_id=${reqId}&recaptcha_required=false&_data=routes%2F_public%2Fu%2Fstart%2F_start`;
  const loginResp = await fetch(loginUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": USER_AGENT,
      "Origin": "https://oauth.iracing.com",
      "Referer": `https://oauth.iracing.com/u/start?req_id=${reqId}&recaptcha_required=false`,
      "Cookie": oauthCookies,
    },
    body: new URLSearchParams({
      email,
      password: hashBase64,
      rememberMe: "yes",
      offer_remember_me: "yes",
    }).toString(),
    redirect: "manual",
  });

  if (!loginResp.ok && loginResp.status !== 302 && loginResp.status !== 301) {
    const body = await loginResp.text();
    throw new Error(`iRacing login failed: ${loginResp.status} — ${body}`);
  }

  // Step 4: Follow redirect back to members-ng to get the session cookie
  const callbackUrl = loginResp.headers.get("location");
  if (!callbackUrl) throw new Error("No redirect location after login POST");

  const callbackResp = await fetch(callbackUrl, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "manual",
  });

  // The session cookie may be on this response or a further redirect
  let sessionCookie = collectCookies(callbackResp)
    .split("; ")
    .find((c) => c.startsWith("irsso_membersv3") || c.startsWith("authtoken_members"));

  if (!sessionCookie) {
    // Follow one more redirect if needed
    const nextUrl = callbackResp.headers.get("location");
    if (nextUrl) {
      const nextResp = await fetch(nextUrl, {
        headers: { "User-Agent": USER_AGENT },
        redirect: "manual",
      });
      sessionCookie = collectCookies(nextResp)
        .split("; ")
        .find((c) => c.startsWith("irsso_membersv3") || c.startsWith("authtoken_members"));
    }
  }

  if (!sessionCookie) throw new Error("Session cookie not found after OAuth flow");

  return sessionCookie;
}

// ─── iRacing API helpers ─────────────────────────────────────────────────────

async function iracingGet<T>(cookie: string, path: string): Promise<T> {
  const resp = await fetch(`${IRACING_BASE}${path}`, {
    headers: { Cookie: cookie, "User-Agent": USER_AGENT },
  });

  if (resp.status === 401) throw new Error("iRacing session expired");
  if (!resp.ok) throw new Error(`iRacing API error on ${path}: ${resp.status}`);

  const json = await resp.json() as { link?: string } & T;

  // Most iRacing endpoints return { link: "<s3-url>" } — fetch the actual data from S3
  if (json.link) {
    const s3 = await fetch(json.link);
    return s3.json() as Promise<T>;
  }

  return json;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Season {
  season_id: number;
  series_id: number;
  series_name: string;
  race_week: number; // current race week (0-indexed)
  schedules: Array<{
    race_week_num: number;
    track: { track_id: number; track_name: string; config_name: string };
  }>;
}

interface SearchResultEntry {
  best_lap_time: number; // tenths of milliseconds, -1 if no lap
  cust_id: number;
  display_name: string;
}

interface SearchSeriesResponse {
  data: {
    chunk_info?: { chunk_file_names: string[]; base_download_url: string };
    rows?: SearchResultEntry[];
  };
  success?: boolean;
}

// ─── Sync logic ──────────────────────────────────────────────────────────────

async function fetchBestLapForSeries(
  cookie: string,
  seasonId: number,
  raceWeekNum: number,
  eventType: 4 | 5, // 4=race, 5=time trial
): Promise<{ bestLapTime: number; custId: number; displayName: string } | null> {
  const path =
    `/data/results/search_series?season_id=${seasonId}&race_week_num=${raceWeekNum}&event_types=${eventType}`;

  const result = await iracingGet<SearchSeriesResponse>(cookie, path);

  let entries: SearchResultEntry[] = [];

  if (result?.data?.chunk_info) {
    // Results are split across chunk files — fetch all
    const { base_download_url, chunk_file_names } = result.data.chunk_info;
    const chunks = await Promise.all(
      chunk_file_names.map((name) =>
        fetch(`${base_download_url}${name}`).then((r) => r.json() as Promise<SearchResultEntry[]>)
      ),
    );
    entries = chunks.flat();
  } else if (result?.data?.rows) {
    entries = result.data.rows;
  }

  if (entries.length === 0) return null;

  // Find the entry with the lowest valid best_lap_time
  const best = entries
    .filter((e) => e.best_lap_time > 0)
    .sort((a, b) => a.best_lap_time - b.best_lap_time)[0];

  if (!best) return null;

  return {
    bestLapTime: best.best_lap_time,
    custId: best.cust_id,
    displayName: best.display_name,
  };
}

// ─── Entry point ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const startedAt = Date.now();

  const email = Deno.env.get("IRACING_EMAIL");
  const password = Deno.env.get("IRACING_PASSWORD");
  if (!email || !password) {
    return new Response("Missing IRACING_EMAIL or IRACING_PASSWORD secrets", { status: 500 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let seriesCount = 0;

  try {
    const cookie = await getAuthCookie(email, password);

    // 1. Get all active seasons (includes current race_week per series)
    const seasons = await iracingGet<Season[]>(cookie, "/data/series/seasons?include_series=1");

    // 2. For each season, fetch the best lap for the current week
    const rows = [];

    for (const season of seasons) {
      const raceWeekNum = season.race_week;
      if (raceWeekNum == null || raceWeekNum < 0) continue;

      const schedule = season.schedules?.find((s) => s.race_week_num === raceWeekNum);
      const track = schedule?.track;

      // Prefer time trial (event_type=5) for cleanest lap comparison; fall back to race (4)
      let eventType: 4 | 5 = 5;
      let best = await fetchBestLapForSeries(cookie, season.season_id, raceWeekNum, 5);
      if (!best) {
        eventType = 4;
        best = await fetchBestLapForSeries(cookie, season.season_id, raceWeekNum, 4);
      }

      rows.push({
        season_id: season.season_id,
        series_id: season.series_id,
        series_name: season.series_name,
        race_week_num: raceWeekNum,
        track_id: track?.track_id ?? null,
        track_name: track?.track_name ?? null,
        config_name: track?.config_name ?? null,
        best_lap_time: best?.bestLapTime ?? null,
        best_cust_id: best?.custId ?? null,
        best_display_name: best?.displayName ?? null,
        event_type: best ? eventType : null,
        synced_at: new Date().toISOString(),
      });

      seriesCount++;
    }

    // 3. Upsert — one row per (season_id, series_id, race_week_num), updated each sync
    const { error } = await supabase
      .from("series_best_laps")
      .upsert(rows, { onConflict: "season_id,series_id,race_week_num" });

    if (error) throw error;

    // 4. Log the run
    await supabase.from("sync_log").insert({
      success: true,
      series_count: seriesCount,
      duration_ms: Date.now() - startedAt,
    });

    console.log(`Sync complete: ${seriesCount} series processed in ${Date.now() - startedAt}ms`);

    return new Response(
      JSON.stringify({ success: true, series_count: seriesCount }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Sync failed:", message);

    await supabase.from("sync_log").insert({
      success: false,
      series_count: seriesCount,
      error_msg: message,
      duration_ms: Date.now() - startedAt,
    });

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
