# HackYourForecast (Revived)

Legacy graduation project revived to run without the original private MySQL setup.

## What Was Revived

- The Express + EJS web app pages under `servers/views`.
- Weather API endpoint: `POST /api/weather`.
- Stats API endpoints used by charts:
	- `GET /api/stats/list`
	- `GET /api/stats/total`
	- `GET /api/stats/:sourceApi`
	- `GET /api/stats/`
- Health endpoint for deployment checks: `GET /healthz`

The app now supports two modes:

- **Live mode (recommended):** fetches forecasts from the open met.no API, caches into PostgreSQL, and serves from DB.
- **Snapshot mode (fallback):** serves historical archived data in `data/*/output.json` if DB is not configured.

## Live Open-Data Integration (met.no + DB + cron)

When `DATABASE_URL` is set, the server:

1. Creates cache tables (`weather_cache`, `stats_hourly`) automatically.
2. Fetches weather from **met.no Locationforecast 2.0** for cities in `citiesFolder/citiesToDisplay.json`.
3. Stores/upserts forecast rows in Postgres.
4. Rebuilds hourly stats for charts.
5. Runs on startup, then every hour via cron (`5 * * * *`).

Required environment variables:

- `DATABASE_URL` = Postgres connection string.
- `METNO_USER_AGENT` = required by met.no policy, example:
	- `HackYourForecast/2.0 (https://your-domain.example; contact@your-domain.example)`

Optional environment variables:

- `HYF_CITY_LIMIT` (integer) to reduce number of cities fetched.
- `HYF_RETENTION_HOURS` (default `72`) to trim old cache rows.
- `PGSSL=disable` for local non-SSL Postgres.

## Run Locally

Requirements:

- Node.js 20+

Install and start:

```bash
npm install
npm start
```

Open:

- App pages: `http://localhost:5000`
- API docs page: `http://localhost:5000/api`

If port `5000` is already used:

```bash
PORT=5050 npm start
```

## Deploy (Render)

This repo includes `render.yaml` for one-click deployment.

1. Push this revived branch/repo to GitHub.
2. In Render, create a **Blueprint** and select this repository.
3. Render will use:
	 - Build command: `npm install --no-audit --no-fund`
	 - Start command: `npm start`
	 - Health check: `/healthz`

After deploy, your live URL will serve both pages and API.

Add environment variables in Render:

- `DATABASE_URL` (from your Render Postgres instance)
- `METNO_USER_AGENT`
- Optional: `HYF_CITY_LIMIT`, `HYF_RETENTION_HOURS`

## Notes

- Historical ingestion/monitoring scripts in `data/` still reference the original 2018 pipeline and are not required for current runtime.
- If DB is missing, snapshot mode keeps the app running for demo use.

## Weather Symbols

- clear sky: `0`
- rain: `1`
- drizzle: `2`
- cloud: `3`
- fog: `4`
- sleet: `5`
- snow: `6`
