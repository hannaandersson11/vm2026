const WEEKDAYS = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];
const MONTHS = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
const RELATIVE_DAY_LABELS = { "-1": "Igår", "0": "Idag", "1": "Imorgon" };
const LIVE_DURATION_MS = 2.5 * 60 * 60 * 1000;

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

function matchCard(match, now) {
  const isSweden = match.home === "Sverige" || match.away === "Sverige";
  const today = todayKey();
  const isToday = match.date === today;
  const isPast = match.homeScore !== null && match.awayScore !== null;
  const start = new Date(match.datetime);
  const isLive = !isPast && now >= start && now - start <= LIVE_DURATION_MS;

  const score = isPast
    ? `<span class="score">${match.homeScore} – ${match.awayScore}</span>`
    : "";

  const homeFlag = match.homeFlag ? `<span class="flag">${match.homeFlag}</span>` : "";
  const awayFlag = match.awayFlag ? `<span class="flag">${match.awayFlag}</span>` : "";

  const classes = ["match-card"];
  if (isSweden) classes.push("sweden");
  if (isToday) classes.push("today");
  if (isPast) classes.push("played");
  if (isLive) classes.push("live");

  let statusBadge = "";
  if (isLive) {
    statusBadge = '<span class="live-badge"><span class="live-dot"></span>Pågår</span>';
  } else if (isToday) {
    statusBadge = '<span class="today-badge">Idag</span>';
  }

  return `
    <div class="${classes.join(" ")}">
      <div class="match-time">
        <span class="time">${match.time}</span>
        ${statusBadge}
        <span class="stage-badge">${stageLabel(match)}</span>
      </div>
      <div class="match-teams">
        <span class="team home">${homeFlag} ${match.home}</span>
        ${score || '<span class="vs">–</span>'}
        <span class="team away">${match.away} ${awayFlag}</span>
      </div>
      <div class="match-venue">📍 ${match.venue}, ${match.city}, ${match.country}</div>
      <div class="match-channel">${channelBadge(match.channel)}</div>
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

  const filtered = MATCHES.filter((m) => {
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
const THEME_COLORS = { light: "#b8540a", dark: "#14181a" };
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

document.getElementById("today-fab").addEventListener("click", () => scrollToToday("smooth"));

document.getElementById("search").addEventListener("input", render);
["channel", "stage", "sweden-only", "upcoming-only"].forEach((id) =>
  document.getElementById(id).addEventListener("change", render)
);

render();
scrollToToday();

// Keep "idag"/"pågår"-status fresh while the app stays open
setInterval(() => {
  if (document.visibilityState === "visible") render();
}, 60000);

let wasHidden = false;
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    wasHidden = true;
  } else if (document.visibilityState === "visible" && wasHidden) {
    location.reload();
  }
});
