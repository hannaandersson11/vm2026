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

## Data

All matchdata finns i [`data/matches.js`](data/matches.js) som en enkel
JavaScript-array (`MATCHES`). Varje match har fälten:

| Fält | Beskrivning |
| --- | --- |
| `date`, `time`, `datetime` | Datum/tid i svensk tid (CEST) |
| `stage`, `group`, `matchday` | Gruppspel/slutspelsskede |
| `home`, `away` | Lagnamn (svenska) |
| `venue`, `city`, `country` | Arena, stad, land |
| `channel` | `"SVT"`, `"TV4"` eller `null` om okänd |
| `homeScore`, `awayScore` | Resultat om matchen spelats |

### Om TV-kanal

Sändningsrätten delas mellan SVT och TV4. Vid det här tillfället gick det
bara att bekräfta kanal för öppningsmatchen, Sveriges tre gruppspelsmatcher
samt finalen. Övriga matcher har `channel: null` och visas som
"Ej bekräftad" i appen. Uppdatera fältet i `data/matches.js` när TV-tablån
bekräftas för fler matcher.
