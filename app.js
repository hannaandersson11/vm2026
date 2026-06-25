const WEEKDAYS = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];
const MONTHS = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
const RELATIVE_DAY_LABELS = { "-1": "Igår", "0": "Idag", "1": "Imorgon" };
const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
const LIVE_DURATION_MS = 2.5 * 60 * 60 * 1000;
const LIVE_SCORES_URL = "/api/scores";
const SCORERS_URL = "/api/scorers";

const CITY_TIMEZONES = {
  "Atlanta": "America/New_York",
  "Boston": "America/New_York",
  "Dallas": "America/Chicago",
  "Guadalajara": "America/Mexico_City",
  "Houston": "America/Chicago",
  "Kansas City": "America/Chicago",
  "Los Angeles": "America/Los_Angeles",
  "Mexico City": "America/Mexico_City",
  "Miami": "America/New_York",
  "Monterrey": "America/Monterrey",
  "New York/New Jersey": "America/New_York",
  "Philadelphia": "America/New_York",
  "San Francisco Bay Area": "America/Los_Angeles",
  "Seattle": "America/Los_Angeles",
  "Toronto": "America/Toronto",
  "Vancouver": "America/Vancouver",
};

const TEAM_INFO = {
  "Uruguay": { flag: "🇺🇾", name: "Uruguay" },
  "Germany": { flag: "🇩🇪", name: "Tyskland" },
  "Spain": { flag: "🇪🇸", name: "Spanien" },
  "Paraguay": { flag: "🇵🇾", name: "Paraguay" },
  "Argentina": { flag: "🇦🇷", name: "Argentina" },
  "Ghana": { flag: "🇬🇭", name: "Ghana" },
  "Brazil": { flag: "🇧🇷", name: "Brasilien" },
  "Portugal": { flag: "🇵🇹", name: "Portugal" },
  "Japan": { flag: "🇯🇵", name: "Japan" },
  "Mexico": { flag: "🇲🇽", name: "Mexiko" },
  "England": { flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", name: "England" },
  "USA": { flag: "🇺🇸", name: "USA" },
  "Korea Republic": { flag: "🇰🇷", name: "Sydkorea" },
  "France": { flag: "🇫🇷", name: "Frankrike" },
  "South Africa": { flag: "🇿🇦", name: "Sydafrika" },
  "Algeria": { flag: "🇩🇿", name: "Algeriet" },
  "Australia": { flag: "🇦🇺", name: "Australien" },
  "New Zealand": { flag: "🇳🇿", name: "Nya Zeeland" },
  "Switzerland": { flag: "🇨🇭", name: "Schweiz" },
  "Ecuador": { flag: "🇪🇨", name: "Ecuador" },
  "Sweden": { flag: "🇸🇪", name: "Sverige" },
  "Czechia": { flag: "🇨🇿", name: "Tjeckien" },
  "Croatia": { flag: "🇭🇷", name: "Kroatien" },
  "Saudi Arabia": { flag: "🇸🇦", name: "Saudiarabien" },
  "Tunisia": { flag: "🇹🇳", name: "Tunisien" },
  "Turkey": { flag: "🇹🇷", name: "Turkiet" },
  "Senegal": { flag: "🇸🇳", name: "Senegal" },
  "Belgium": { flag: "🇧🇪", name: "Belgien" },
  "Morocco": { flag: "🇲🇦", name: "Marocko" },
  "Austria": { flag: "🇦🇹", name: "Österrike" },
  "Colombia": { flag: "🇨🇴", name: "Colombia" },
  "Egypt": { flag: "🇪🇬", name: "Egypten" },
  "Canada": { flag: "🇨🇦", name: "Kanada" },
  "Haiti": { flag: "🇭🇹", name: "Haiti" },
  "Iran": { flag: "🇮🇷", name: "Iran" },
  "Bosnia-H.": { flag: "🇧🇦", name: "Bosnien" },
  "Panama": { flag: "🇵🇦", name: "Panama" },
  "Cape Verde": { flag: "🇨🇻", name: "Kap Verde" },
  "Congo DR": { flag: "🇨🇩", name: "DR Kongo" },
  "Ivory Coast": { flag: "🇨🇮", name: "Elfenbenskusten" },
  "Qatar": { flag: "🇶🇦", name: "Qatar" },
  "Jordan": { flag: "🇯🇴", name: "Jordanien" },
  "Iraq": { flag: "🇮🇶", name: "Irak" },
  "Uzbekistan": { flag: "🇺🇿", name: "Uzbekistan" },
  "Netherlands": { flag: "🇳🇱", name: "Nederländerna" },
  "Norway": { flag: "🇳🇴", name: "Norge" },
  "Scotland": { flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", name: "Skottland" },
  "Curaçao": { flag: "🇨🇼", name: "Curaçao" },
};

let liveScores = null;
let scorers = null;
let hideScores = localStorage.getItem("hideScores") !== "false";

function resolveTeams(match) {
  const live = liveScores && liveScores[match.fdId];
  if (!live) return match;

  let changed = false;
  const resolved = {};

  if (live.homeTeam) {
    const info = TEAM_INFO[live.homeTeam];
    resolved.home = info ? info.name : live.homeTeam;
    resolved.homeFlag = info ? info.flag : null;
    changed = true;
  }
  if (live.awayTeam) {
    const info = TEAM_INFO[live.awayTeam];
    resolved.away = info ? info.name : live.awayTeam;
    resolved.awayFlag = info ? info.flag : null;
    changed = true;
  }

  return changed ? { ...match, ...resolved } : match;
}

function buildKnockoutLookup(standings) {
  const lookup = {};
  const completedGroups = new Set();

  for (const g of GROUPS) {
    const rows = standings[g];
    if (rows.length >= 4 && rows.every((r) => r.played === 3)) {
      completedGroups.add(g);
      lookup[`Vinnare grupp ${g}`] = rows[0];
      lookup[`Tvåa grupp ${g}`] = rows[1];
    }
  }

  if (completedGroups.size === 12) {
    const bestThird = computeBestThirdPlaced(standings);
    const qualified = bestThird.slice(0, 8);
    const qualifiedGroups = new Set(qualified.map((r) => r.group));

    for (const m of MATCHES) {
      if (m.stage !== "Sextondelsfinal") continue;
      for (const side of ["home", "away"]) {
        const name = m[side];
        const thirdMatch = name.match(/^3:a i grupp (.+)$/);
        if (!thirdMatch) continue;
        const candidates = thirdMatch[1].split("/");
        const match = candidates.find((g) => qualifiedGroups.has(g));
        if (match) {
          const team = qualified.find((r) => r.group === match);
          if (team) lookup[name] = team;
        }
      }
    }
  }

  return lookup;
}

function resolveKnockout(match, knockoutLookup) {
  if (match.stage === "Gruppspel") return match;

  let changed = false;
  const resolved = {};

  const homeLookup = knockoutLookup[match.home];
  if (homeLookup) {
    resolved.home = homeLookup.name;
    resolved.homeFlag = homeLookup.flag;
    changed = true;
  }
  const awayLookup = knockoutLookup[match.away];
  if (awayLookup) {
    resolved.away = awayLookup.name;
    resolved.awayFlag = awayLookup.flag;
    changed = true;
  }

  return changed ? { ...match, ...resolved } : match;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateHeading(dateStr) {
  const d = new Date(dateStr + "T12:00:00+02:00");
  const base = `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  const diffDays = Math.round((Date.parse(dateStr) - Date.parse(todayKey())) / 86400000);
  const prefix = RELATIVE_DAY_LABELS[String(diffDays)];
  return prefix ? `${prefix} · ${base}` : base;
}

function stageLabel(match) {
  if (match.stage === "Gruppspel") {
    return `Grupp ${match.group} · Omgång ${match.matchday}`;
  }
  return match.stage;
}

function channelBadge(channel) {
  if (channel === "SVT") return `<span class="badge badge-svt">SVT</span>`;
  if (channel === "TV4") return `<span class="badge badge-tv4">TV4</span>`;
  return `<span class="badge badge-unknown">Ej bekräftad</span>`;
}

function localTimeLabel(match) {
  const timeZone = CITY_TIMEZONES[match.city];
  if (!timeZone) return "";

  const d = new Date(match.datetime);
  const time = new Intl.DateTimeFormat("sv-SE", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone }).format(d);
  const localDate = new Intl.DateTimeFormat("en-CA", { timeZone }).format(d);
  const dayBefore = localDate < match.date ? " (dagen innan)" : "";

  return `<span class="local-time">${time} lokal tid${dayBefore}</span>`;
}

function getMatchState(match, now) {
  let home = match.homeScore;
  let away = match.awayScore;
  let isFinished = home !== null && away !== null;
  let isLive = false;
  let suppressLive = false;

  const live = liveScores && liveScores[match.fdId];
  if (live) {
    if (live.status === "IN_PLAY" || live.status === "PAUSED") {
      isLive = true;
      home = live.home;
      away = live.away;
    } else if (live.status === "FINISHED" || live.status === "AWARDED") {
      isFinished = true;
      home = live.home;
      away = live.away;
    } else if (live.status === "POSTPONED" || live.status === "SUSPENDED" || live.status === "CANCELLED") {
      suppressLive = true;
    }
  }

  if (!isLive && !isFinished && !suppressLive) {
    const start = new Date(match.datetime);
    isLive = now >= start && now - start <= LIVE_DURATION_MS;
  }

  if (isLive) {
    if (home === null) home = 0;
    if (away === null) away = 0;
  }

  return { home, away, isFinished, isLive };
}

function matchCard(match, now) {
  const isSweden = match.home === "Sverige" || match.away === "Sverige";
  const today = todayKey();
  const isToday = match.date === today;

  const { home: homeScoreValue, away: awayScoreValue, isFinished, isLive } = getMatchState(match, now);
  const showScore = (isFinished || isLive) && !hideScores;

  const homeFlag = match.homeFlag ? `<span class="flag">${match.homeFlag}</span>` : "";
  const awayFlag = match.awayFlag ? `<span class="flag">${match.awayFlag}</span>` : "";

  const classes = ["match-card"];
  if (isSweden) classes.push("sweden");
  if (isToday) classes.push("today");
  if (isLive) classes.push("live");

  let statusBadge = "";
  if (isLive) {
    statusBadge = '<span class="live-badge"><span class="live-dot"></span>Pågår</span>';
  } else if (isToday) {
    statusBadge = '<span class="today-badge">Idag</span>';
  }

  let homeRowClass = "";
  let awayRowClass = "";
  let homeScore = "";
  let awayScore = "";
  if (showScore) {
    homeScore = `<span class="team-score">${homeScoreValue}</span>`;
    awayScore = `<span class="team-score">${awayScoreValue}</span>`;
    if (isFinished) {
      if (homeScoreValue > awayScoreValue) {
        homeRowClass = " winner";
        awayRowClass = " loser";
      } else if (awayScoreValue > homeScoreValue) {
        awayRowClass = " winner";
        homeRowClass = " loser";
      }
    }
  }

  return `
    <div class="${classes.join(" ")}">
      <div class="match-header">
        <div class="match-header-top">
          <span class="time">${match.time}</span>
          ${statusBadge}
          <span class="stage-badge">${stageLabel(match)}</span>
        </div>
        ${localTimeLabel(match)}
      </div>
      <div class="match-teams">
        <div class="team-row${homeRowClass}">
          <span class="team-name">${homeFlag} ${match.home}</span>
          ${homeScore}
        </div>
        <div class="team-row${awayRowClass}">
          <span class="team-name">${awayFlag} ${match.away}</span>
          ${awayScore}
        </div>
      </div>
      <div class="match-footer">
        <span class="match-venue">${match.venue}, ${match.city}, ${match.country}</span>
        ${channelBadge(match.channel)}
      </div>
    </div>
  `;
}

function activeFilterCount() {
  let count = 0;
  if (document.getElementById("search").value.trim()) count++;
  if (document.getElementById("channel").value) count++;
  if (document.getElementById("stage").value) count++;
  if (document.getElementById("sweden-only").checked) count++;
  if (document.getElementById("upcoming-only").checked) count++;
  return count;
}

function updateFilterIndicators() {
  const count = activeFilterCount();
  const badge = document.getElementById("filter-count");
  const resetBtn = document.getElementById("reset-filters");
  badge.textContent = String(count);
  badge.hidden = count === 0;
  resetBtn.hidden = count === 0;
}

function render() {
  const search = document.getElementById("search").value.trim().toLowerCase();
  const channel = document.getElementById("channel").value;
  const stage = document.getElementById("stage").value;
  const swedenOnly = document.getElementById("sweden-only").checked;
  const upcomingOnly = document.getElementById("upcoming-only").checked;
  const now = new Date();

  updateFilterIndicators();

  const knockoutLookup = buildKnockoutLookup(computeStandings(now));
  const resolved = MATCHES.map((m) => resolveKnockout(resolveTeams(m), knockoutLookup));

  const filtered = resolved.filter((m) => {
    if (search) {
      const haystack = `${m.home} ${m.away} ${m.city} ${m.venue}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (channel === "UNKNOWN" && m.channel) return false;
    if (channel === "SVT" && m.channel !== "SVT") return false;
    if (channel === "TV4" && m.channel !== "TV4") return false;
    if (stage && m.stage !== stage) return false;
    if (swedenOnly && m.home !== "Sverige" && m.away !== "Sverige") return false;
    if (upcomingOnly && new Date(m.datetime) < now) return false;
    return true;
  });

  document.getElementById("result-count").textContent =
    `Visar ${filtered.length} av ${MATCHES.length} matcher`;

  const list = document.getElementById("match-list");
  if (filtered.length === 0) {
    list.innerHTML = `<p class="empty">Inga matcher matchar din filtrering.</p>`;
    setupTodayObserver();
    return;
  }

  const groups = [];
  let currentDate = null;
  let currentGroup = null;
  for (const m of filtered) {
    if (m.date !== currentDate) {
      currentDate = m.date;
      currentGroup = { date: m.date, matches: [] };
      groups.push(currentGroup);
    }
    currentGroup.matches.push(m);
  }

  list.innerHTML = groups
    .map(
      (g) => `
      <section class="date-group" data-date="${g.date}">
        <h2 class="date-heading">${formatDateHeading(g.date)}</h2>
        ${g.matches.map((m) => matchCard(m, now)).join("")}
      </section>
    `
    )
    .join("");

  setupTodayObserver();
}

function newStandingsRow(name, flag) {
  return { name, flag, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
}

function computeStandings(now) {
  const tables = {};
  for (const g of GROUPS) tables[g] = {};

  for (const m of MATCHES) {
    if (m.stage !== "Gruppspel") continue;
    const table = tables[m.group];
    if (!table[m.home]) table[m.home] = newStandingsRow(m.home, m.homeFlag);
    if (!table[m.away]) table[m.away] = newStandingsRow(m.away, m.awayFlag);

    const { home, away, isFinished } = getMatchState(m, now);
    if (!isFinished) continue;

    const homeRow = table[m.home];
    const awayRow = table[m.away];
    homeRow.played++;
    awayRow.played++;
    homeRow.goalsFor += home;
    homeRow.goalsAgainst += away;
    awayRow.goalsFor += away;
    awayRow.goalsAgainst += home;
    if (home > away) {
      homeRow.won++;
      awayRow.lost++;
      homeRow.points += 3;
    } else if (away > home) {
      awayRow.won++;
      homeRow.lost++;
      awayRow.points += 3;
    } else {
      homeRow.drawn++;
      awayRow.drawn++;
      homeRow.points++;
      awayRow.points++;
    }
  }

  const standings = {};
  for (const g of GROUPS) {
    standings[g] = Object.values(tables[g]).sort(
      (a, b) =>
        b.points - a.points ||
        (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) ||
        b.goalsFor - a.goalsFor ||
        a.name.localeCompare(b.name)
    );
  }
  return standings;
}

function standingsTable(group, rows) {
  return `
    <div class="standings-group">
      <h2 class="standings-heading">Grupp ${group}</h2>
      <table class="standings-table">
        <thead>
          <tr>
            <th class="col-team">Lag</th>
            <th>S</th>
            <th>V</th>
            <th>O</th>
            <th>F</th>
            <th>MS</th>
            <th>P</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map((r, i) => {
              const flag = r.flag ? `<span class="flag">${r.flag}</span>` : "";
              const rowClass = r.name === "Sverige" ? " sweden" : "";
              return `
                <tr class="${rowClass}">
                  <td class="col-team"><span class="standings-pos">${i + 1}</span>${flag} ${r.name}</td>
                  <td>${r.played}</td>
                  <td>${r.won}</td>
                  <td>${r.drawn}</td>
                  <td>${r.lost}</td>
                  <td>${r.goalsFor - r.goalsAgainst}</td>
                  <td class="col-points">${r.points}</td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderStandings() {
  const standings = computeStandings(new Date());
  const bestThird = computeBestThirdPlaced(standings);
  document.getElementById("standings-list").innerHTML =
    GROUPS.map((g) => standingsTable(g, standings[g])).join("") +
    bestThirdTable(bestThird);
}

function computeBestThirdPlaced(standings) {
  const thirds = [];
  for (const g of GROUPS) {
    if (standings[g].length >= 3) {
      thirds.push({ ...standings[g][2], group: g });
    }
  }
  thirds.sort(
    (a, b) =>
      b.points - a.points ||
      (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) ||
      b.goalsFor - a.goalsFor ||
      a.name.localeCompare(b.name)
  );
  return thirds;
}

function bestThirdTable(rows) {
  return `
    <div class="standings-group best-third-group">
      <h2 class="standings-heading">Bästa 3:or</h2>
      <table class="standings-table">
        <thead>
          <tr>
            <th class="col-team">Lag</th>
            <th>Gr</th>
            <th>S</th>
            <th>V</th>
            <th>O</th>
            <th>F</th>
            <th>MS</th>
            <th>P</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((r, i) => {
            const flag = r.flag ? `<span class="flag">${r.flag}</span>` : "";
            const classes = [];
            if (r.name === "Sverige") classes.push("sweden");
            if (i < 8) classes.push("qualified");
            else classes.push("not-qualified");
            if (i === 7) classes.push("cutoff");
            return `
              <tr class="${classes.join(" ")}">
                <td class="col-team"><span class="standings-pos">${i + 1}</span>${flag} ${r.name}</td>
                <td>${r.group}</td>
                <td>${r.played}</td>
                <td>${r.won}</td>
                <td>${r.drawn}</td>
                <td>${r.lost}</td>
                <td>${r.goalsFor - r.goalsAgainst}</td>
                <td class="col-points">${r.points}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
      <p class="best-third-note">Topp 8 går vidare till sextondelsfinalen.</p>
    </div>
  `;
}

function scorerRow(p, i) {
  const info = TEAM_INFO[p.team] || { flag: "", name: p.team };
  const flag = info.flag ? `<span class="flag">${info.flag}</span>` : "";
  const assists = p.assists ?? "–";
  return `
    <tr>
      <td class="col-team">
        <span class="standings-pos">${i + 1}</span>${flag}<span class="scorer-name">${p.player}<span class="scorer-team-name">${info.name}</span></span>
      </td>
      <td>${p.played}</td>
      <td class="col-points">${p.goals}</td>
      <td>${assists}</td>
    </tr>
  `;
}

function renderScorers() {
  const list = document.getElementById("scorers-list");
  if (scorers === null) {
    list.innerHTML = `<p class="empty">Laddar skytteliga…</p>`;
    return;
  }
  if (scorers.length === 0) {
    list.innerHTML = `<p class="empty">Ingen skyttedata ännu.</p>`;
    return;
  }
  list.innerHTML = `
    <div class="standings-group">
      <h2 class="standings-heading">Skytteliga</h2>
      <table class="standings-table scorers-table">
        <thead>
          <tr>
            <th class="col-team">Spelare</th>
            <th>S</th>
            <th>Mål</th>
            <th>Assist</th>
          </tr>
        </thead>
        <tbody>
          ${scorers.map(scorerRow).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function findTodayTarget() {
  const today = todayKey();
  const groups = document.querySelectorAll(".date-group");
  for (const group of groups) {
    if (group.dataset.date >= today) return group;
  }
  return groups[groups.length - 1] || null;
}

function scrollToToday(behavior) {
  const target = findTodayTarget();
  if (target) target.scrollIntoView({ block: "start", behavior: behavior || "auto" });
}

let todayObserver = null;
function setupTodayObserver() {
  const fab = document.getElementById("today-fab");
  if (todayObserver) todayObserver.disconnect();

  const target = findTodayTarget();
  if (!target) {
    fab.classList.remove("visible");
    return;
  }

  todayObserver = new IntersectionObserver(
    ([entry]) => fab.classList.toggle("visible", !entry.isIntersecting),
    { threshold: 0 }
  );
  todayObserver.observe(target);
}

// Filters: collapsible panel with persisted state and active-filter indicators
const filtersToggle = document.getElementById("filters-toggle");
const filtersBody = document.getElementById("filters-body");

function setFiltersExpanded(expanded) {
  filtersBody.hidden = !expanded;
  filtersToggle.setAttribute("aria-expanded", String(expanded));
  filtersToggle.classList.toggle("expanded", expanded);
}

setFiltersExpanded(localStorage.getItem("filtersExpanded") === "true");

filtersToggle.addEventListener("click", () => {
  const expanded = filtersBody.hidden;
  setFiltersExpanded(expanded);
  localStorage.setItem("filtersExpanded", String(expanded));
});

document.getElementById("reset-filters").addEventListener("click", () => {
  document.getElementById("search").value = "";
  document.getElementById("channel").value = "";
  document.getElementById("stage").value = "";
  document.getElementById("sweden-only").checked = false;
  document.getElementById("upcoming-only").checked = false;
  render();
});

// Dark mode toggle, persisted in localStorage (falls back to system preference)
const THEME_COLORS = { light: "#f5f6f4", dark: "#14181a" };
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = themeToggle.querySelector("span");
const metaThemeColor = document.querySelector('meta[name="theme-color"]');

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
  themeToggle.setAttribute("aria-label", theme === "dark" ? "Växla till ljust läge" : "Växla till mörkt läge");
  metaThemeColor.setAttribute("content", THEME_COLORS[theme]);
}

applyTheme(document.documentElement.getAttribute("data-theme") || "light");

themeToggle.addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem("theme", next);
});

const scoreToggle = document.getElementById("score-toggle");

function updateScoreToggle() {
  scoreToggle.textContent = hideScores ? "Visa resultat" : "Dölj resultat";
  scoreToggle.setAttribute("aria-label", hideScores ? "Visa matchresultat" : "Dölj matchresultat");
}

updateScoreToggle();

scoreToggle.addEventListener("click", () => {
  hideScores = !hideScores;
  localStorage.setItem("hideScores", String(hideScores));
  updateScoreToggle();
  render();
});

document.getElementById("today-fab").addEventListener("click", () => scrollToToday("smooth"));

document.getElementById("search").addEventListener("input", render);
["channel", "stage", "sweden-only", "upcoming-only"].forEach((id) =>
  document.getElementById(id).addEventListener("change", render)
);

// Bottom nav: växla mellan "Matcher" och "Tabeller"
const views = {
  matches: document.getElementById("view-matches"),
  standings: document.getElementById("view-standings"),
  stats: document.getElementById("view-stats"),
};
const navButtons = document.querySelectorAll(".nav-btn");
const filtersSection = document.querySelector(".filters");

function setActiveView(view) {
  for (const [name, el] of Object.entries(views)) {
    el.hidden = name !== view;
  }
  filtersSection.hidden = view !== "matches";
  navButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.view === view));
  if (view === "standings") {
    renderStandings();
    if (todayObserver) todayObserver.disconnect();
    document.getElementById("today-fab").classList.remove("visible");
  } else if (view === "stats") {
    renderScorers();
    if (scorers === null) fetchScorers();
    if (todayObserver) todayObserver.disconnect();
    document.getElementById("today-fab").classList.remove("visible");
  } else {
    setupTodayObserver();
  }
  localStorage.setItem("activeView", view);
}

navButtons.forEach((btn) => btn.addEventListener("click", () => setActiveView(btn.dataset.view)));

async function fetchLiveScores() {
  try {
    const res = await fetch(LIVE_SCORES_URL);
    if (!res.ok) return;
    const data = await res.json();
    liveScores = data.matches;
    render();
    if (!views.standings.hidden) renderStandings();
  } catch {
    // Ingen uppkoppling eller proxyn är otillgänglig – visa statisk data från matches.js.
  }
}

async function fetchScorers() {
  try {
    const res = await fetch(SCORERS_URL);
    if (!res.ok) return;
    const data = await res.json();
    scorers = data.scorers;
    if (!views.stats.hidden) renderScorers();
  } catch {
    // Ingen uppkoppling eller proxyn är otillgänglig.
  }
}

render();
setActiveView(localStorage.getItem("activeView") || "matches");
scrollToToday();
fetchLiveScores();

// Keep "idag"/"pågår"-status och liveresultat färska medan appen är öppen
setInterval(() => {
  if (document.visibilityState === "visible") {
    render();
    if (!views.standings.hidden) renderStandings();
    if (!views.stats.hidden) fetchScorers();
    fetchLiveScores();
  }
}, 60000);

let wasHidden = false;
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    wasHidden = true;
  } else if (document.visibilityState === "visible" && wasHidden) {
    location.reload();
  }
});
