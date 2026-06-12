// Serverless proxy mot football-data.org: håller API-nyckeln hemlig och
// cachar svaret så att vi håller oss inom gratisplanens 10 anrop/minut,
// oavsett hur många besökare appen har.
const FD_URL = "https://api.football-data.org/v4/competitions/WC/scorers?limit=50";
const CACHE_TTL_MS = 5 * 60 * 1000;

// Återanvänds mellan anrop så länge funktionsinstansen hålls varm.
let cache = null; // { fetchedAt, body }
let rateLimited = null; // { until }

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");

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
    const players = data.scorers.map((s) => ({
      player: s.player.name,
      team: s.team.shortName || s.team.name,
      played: s.playedMatches,
      goals: s.goals,
      assists: s.assists,
    }));

    const scorers = [...players].sort((a, b) => b.goals - a.goals).slice(0, 20);
    const assists = players
      .filter((p) => p.assists)
      .sort((a, b) => b.assists - a.assists)
      .slice(0, 20);

    const body = { updatedAt: new Date().toISOString(), scorers, assists };
    cache = { fetchedAt: now, body };

    return res.status(200).json(body);
  } catch {
    if (cache) return res.status(200).json(cache.body);
    return res.status(502).json({ error: "Kunde inte nå football-data.org" });
  }
};
