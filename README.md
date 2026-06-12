# VM 2026 – Matcher, tider & TV-kanal

En enkel statisk webbapp som visar alla 104 matcher i fotbolls-VM 2026,
med datum, avsparkstid i svensk tid, TV-kanal (SVT/TV4) och vilken arena/stad
matchen spelas på.

## Köra appen

Inga byggsteg eller beroenden krävs – bara statiska filer. Starta en lokal
webbserver i mappen och öppna den i webbläsaren, t.ex.:

```bash
npx http-server -p 8080
# öppna http://localhost:8080
```

(En enkel `file://`-öppning av `index.html` kan fungera men en lokal server
rekommenderas.)

## Funktioner

- Lista över alla matcher, grupperade per dag, sorterade efter tid.
- Sök på lag.
- Filtrera på TV-kanal (SVT / TV4 / ej bekräftad), skede (gruppspel,
  sextondelsfinal, åttondelsfinal, kvartsfinal, semifinal, bronsmatch, final).
- Kryssruta för att bara visa Sveriges matcher respektive kommande matcher.
- Dagens matcher markeras med en "Idag"-etikett.
- Redan spelade matcher visas med resultat.
- Pågående matcher hämtar live-resultat och status från football-data.org
  (se nedan) och visas med en "Pågår"-etikett.

## Data

All matchdata finns i [`data/matches.js`](data/matches.js) som en enkel
JavaScript-array (`MATCHES`). Varje match har fälten:

| Fält | Beskrivning |
| --- | --- |
| `id` | Internt löpnummer (1–104) |
| `fdId` | Matchens id i football-data.org, används för att hämta liveresultat |
| `date`, `time`, `datetime` | Datum/tid i svensk tid (CEST) |
| `stage`, `group`, `matchday` | Gruppspel/slutspelsskede |
| `home`, `away` | Lagnamn (svenska) |
| `venue`, `city`, `country` | Arena, stad, land |
| `channel` | `"SVT"`, `"TV4"` eller `null` om okänd |
| `homeScore`, `awayScore` | Resultat om matchen spelats (statiskt fallback-värde) |

## Liveresultat (football-data.org)

[`api/scores.js`](api/scores.js) är en serverless-funktion (Vercel) som
hämtar matchstatus och resultat från football-data.org:s API och
cachar svaret i ~60 sekunder för att hålla sig inom gratisplanens gräns på
10 anrop/minut. `app.js` anropar `/api/scores` var 60:e sekund medan appen är
öppen och slår ihop resultatet med `fdId` – om anropet misslyckas (t.ex. ingen
nyckel konfigurerad) visas bara den statiska datan från `matches.js`.

För att aktivera detta i produktion (Vercel):

1. Skaffa en gratis API-nyckel på https://www.football-data.org/client/register
2. Lägg till den som miljövariabel `FOOTBALL_DATA_API_KEY` i projektets
   Vercel-inställningar (Settings → Environment Variables).
3. Committa **aldrig** nyckeln till repot – den läses enbart från
   `process.env` i `api/scores.js`.

Vid lokal utveckling, skapa en `.env.local` (ignoreras av git) med
`FOOTBALL_DATA_API_KEY=din-nyckel` och använd `vercel dev` för att köra både
statiska filer och API-routen.

### Om TV-kanal

Sändningsrätten delas mellan SVT och TV4. Samtliga 72 gruppspelsmatcher har
bekräftad kanal. För slutspelet (sextondelsfinal t.o.m. semifinal) är kanalen
ännu inte bekräftad och dessa matcher har `channel: null` och visas som
"Ej bekräftad" i appen. Bronsmatchen och finalen är förhandstippade till TV4.
Uppdatera fältet i `data/matches.js` när TV-tablån bekräftas för fler matcher.
