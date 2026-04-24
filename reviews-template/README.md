# Reviews template

Alles wat je nodig hebt om de Google Reviews-sectie te implementeren.

## Bestanden

| Bestand | Doel |
|---|---|
| `snippet.html` | HTML-sectie, plak dit in je pagina |
| `google-reviews.js` | Frontend JavaScript voor carousel, kaarten en toggle |
| `update-reviews.mjs` | Node.js-script dat reviews ophaalt via SerpApi |
| `update-reviews.yml` | GitHub Actions workflow voor automatische updates |
| `google-icon.jpg` | Google-logo gebruikt in de kaarten en CTA |

## Installatie

### 1. Bestanden plaatsen

- Kopieer `google-reviews.js` naar `src/js/`
- Kopieer `update-reviews.mjs` naar `scripts/`
- Kopieer `update-reviews.yml` naar `.github/workflows/`
- Kopieer `google-icon.jpg` naar `src/assets/icons/`

### 2. HTML toevoegen

Plak de inhoud van `snippet.html` op de gewenste plek in je pagina.

Voeg onderaan de pagina (voor `</body>`) het script toe:

```html
<script src="./js/google-reviews.js" defer></script>
```

### 3. npm-script toevoegen

Voeg dit toe aan de `scripts`-sectie in `package.json`:

```json
"update-reviews": "node ./scripts/update-reviews.mjs"
```

### 4. Reviews ophalen

Zet je SerpApi-sleutel in een omgevingsvariabele en run:

```bash
SERPAPI_API_KEY=jouw_sleutel npm run update-reviews
```

Op Windows (PowerShell):

```powershell
$env:SERPAPI_API_KEY="jouw_sleutel"; npm run update-reviews
```

Dit schrijft `src/assets/files/google-reviews.json`.

### 5. Automatische updates via GitHub Actions

1. Ga in je GitHub-repo naar **Settings → Secrets and variables → Actions**.
2. Voeg een secret toe met de naam `SERPAPI_API_KEY` en jouw sleutel als waarde.
3. Push de workflow naar je standaardbranch.
4. Pas in `update-reviews.yml` eventueel `RUN_EVERY_DAYS` en `ANCHOR_DATE` aan.

De workflow draait dagelijks, maar voert alleen echt iets uit op de dag die past bij het interval. Na een update bouwt hij de site opnieuw en commit de gewijzigde bestanden terug.

## Configuratie

Bovenin `google-reviews.js` staat een `CONFIG`-object. De meestgebruikte opties:

| Optie | Standaard | Omschrijving |
|---|---|---|
| `snippetCharLimit` | `120` | Tekens waarna de ellipsis verschijnt |
| `maxVisibleReviews` | `20` | Maximaal aantal kaarten in de carousel |
| `minRating` | `4` | Minimale sterrenscore om getoond te worden |
| `cardsPerView.sm` | `2` | Kaarten zichtbaar op tablet |
| `cardsPerView.lg` | `3` | Kaarten zichtbaar op desktop |
