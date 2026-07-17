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

Instead of querying MySQL, the app now serves data from archived snapshots in `data/*/output.json`.

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

## Notes

- Historical ingestion/monitoring scripts in `data/` still reference old DB-based flow and are not required for running the revived app.
- Data is snapshot-based, so this is a stable demo environment for portfolio use.

## Weather Symbols

- clear sky: `0`
- rain: `1`
- drizzle: `2`
- cloud: `3`
- fog: `4`
- sleet: `5`
- snow: `6`
