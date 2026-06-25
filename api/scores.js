// Serverless proxy mot football-data.org: håller API-nyckeln hemlig och
// cachar svaret så att vi håller oss inom gratisplanens 10 anrop/minut,
// oavsett hur många besökare appen har.
const FD_URL = "https://api.football-data.org/v4/competitions/WC/matches?season=2026";
const CACHE_TTL_MS = 60 * 1000;

// Återanvänds mellan anrop så länge funktionsinstansen hålls varm.
let cache = null; // { fetchedAt, body }
let rateLimited = null; // { until }

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=30, s-maxage=60, stale-while-revalidate=300");

  const now = Date.now();

  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return res.status(200).json(cache.body);
  }

  if (rateLimited && now < rateLimited.until) {
    if (cache) return res.status(200).json(cache.body);
    return res.status(429).json({ error: "Rate limited, no cached data available" });
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    if (cache) return res.status(200).json(cache.body);
    return res.status(503).json({ error: "FOOTBALL_DATA_API_KEY saknas" });
  }

  try {
    const upstream = await fetch(FD_URL, { headers: { "X-Auth-Token": apiKey } });

    const remaining = Number(upstream.headers.get("x-requests-available-minute"));
    const resetSeconds = Number(upstream.headers.get("x-requestcounter-reset"));
    if (Number.isFinite(remaining) && remaining <= 0 && Number.isFinite(resetSeconds)) {
      rateLimited = { until: now + resetSeconds * 1000 };
    }

    if (upstream.status === 429) {
      if (cache) return res.status(200).json(cache.body);
      return res.status(429).json({ error: "Rate limited av football-data.org" });
    }

    if (!upstream.ok) {
      if (cache) return res.status(200).json(cache.body);
      return res.status(upstream.status).json({ error: "Fel från football-data.org" });
    }

    const data = await upstream.json();
    const matches = {};
    for (const m of data.matches) {
      matches[m.id] = {
        status: m.status,
        home: m.score?.fullTime?.home ?? 0,
        away: m.score?.fullTime?.away ?? 0,
        homeTeam: m.homeTeam?.shortName || null,
        awayTeam: m.awayTeam?.shortName || null,
      };
    }

    const body = { updatedAt: new Date().toISOString(), matches };
    cache = { fetchedAt: now, body };

    return res.status(200).json(body);
  } catch {
    if (cache) return res.status(200).json(cache.body);
    return res.status(502).json({ error: "Kunde inte nå football-data.org" });
  }
};
