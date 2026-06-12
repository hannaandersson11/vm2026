const WEEKDAYS = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];
const MONTHS = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateHeading(dateStr) {
  const d = new Date(dateStr + "T12:00:00+02:00");
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
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

function matchCard(match) {
  const isSweden = match.home === "Sverige" || match.away === "Sverige";
  const today = todayKey();
  const isToday = match.date === today;
  const isPast = match.homeScore !== null && match.awayScore !== null;

  const score = isPast
    ? `<span class="score">${match.homeScore} – ${match.awayScore}</span>`
    : "";

  const homeFlag = match.homeFlag ? `<span class="flag">${match.homeFlag}</span>` : "";
  const awayFlag = match.awayFlag ? `<span class="flag">${match.awayFlag}</span>` : "";

  const classes = ["match-card"];
  if (isSweden) classes.push("sweden");
  if (isToday) classes.push("today");
  if (isPast) classes.push("played");

  return `
    <div class="${classes.join(" ")}">
      <div class="match-time">
        <span class="time">${match.time}</span>
        ${isToday ? '<span class="today-badge">Idag</span>' : ""}
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

function render() {
  const search = document.getElementById("search").value.trim().toLowerCase();
  const channel = document.getElementById("channel").value;
  const stage = document.getElementById("stage").value;
  const swedenOnly = document.getElementById("sweden-only").checked;
  const upcomingOnly = document.getElementById("upcoming-only").checked;
  const now = new Date();

  const filtered = MATCHES.filter((m) => {
    if (search) {
      const haystack = `${m.home} ${m.away}`.toLowerCase();
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
      <section class="date-group">
        <h2 class="date-heading">${formatDateHeading(g.date)}</h2>
        ${g.matches.map(matchCard).join("")}
      </section>
    `
    )
    .join("");
}

document.getElementById("search").addEventListener("input", render);
["channel", "stage", "sweden-only", "upcoming-only"].forEach((id) =>
  document.getElementById(id).addEventListener("change", render)
);

render();
