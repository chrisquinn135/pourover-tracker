# Pourover

Personal pourover brew tracker built with **SvelteKit**. Bean bags and brew logs persist in **Google Sheets** via a service account. Without Sheets credentials, the app runs on built-in sample data so you can try every screen locally.

## Features

- **Add a log** — bag, water temp, grind size, grinder, dripper, total time, rating /10, notes
- **Add a bean** — bag name, origin, region, roaster, farm, roast, variety, altitude, process, size (small/medium/large), notes, in-progress/finished (+ ranking when finished). Country, roaster, farm, process, variety, and altitude are comboboxes fed by prior bags.
- **Feed** (home) — all pours or filtered to one bag
- **Bags list** — in-progress and finished lists (finished sorted by ranking)
- **Find closest bean** — weighted similarity for a starting recipe

### Closest-bean scoring

Roast (35), altitude (20), process (15), geography (10), variety (8), roaster (7), bean size (5). Missing fields are skipped, then scores normalize over comparable weight. Light↔dark pairs are capped at 40. Finished bags and bags with logs get a soft boost.

## Run locally

```bash
npm install
npm run dev
```

Dev server: `http://127.0.0.1:3457`

```bash
npm run build
npm run preview -- --port 3457 --host 127.0.0.1
```

## Google Sheets setup

1. Create a Google Cloud service account and download a JSON key.
2. Create a blank Google Sheet and share it with the service account email (**Editor**).
3. Set these environment variables (published app: bind them as secrets in Cursor):

| Variable | Description |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email |
| `GOOGLE_PRIVATE_KEY` | Service account private key PEM (escaped newlines OK) |
| `GOOGLE_SHEET_ID` | Spreadsheet ID from the Sheet URL |

On first write, the app creates **Beans** and **Logs** tabs with headers if they are missing.

## Scripts

- `npm run dev` — development server on port 3457
- `npm run build` — production build
- `npm run check` — TypeScript / Svelte check
