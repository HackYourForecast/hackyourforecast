# Meteorological Provider Candidates

This document lists candidate agencies/providers to integrate into HackYourForecast and the requirements for each.

## Integration Contract

For each provider adapter, implement:

- `id`: stable source id (e.g. `metno`, `openmeteo`)
- `requiredEnv`: list of env vars needed
- `fetchForecastForCity(city, context)`: returns normalized row with:
  - `sourceApi`, `geohash5`, `geohash3`, `lat`, `lng`, `symbol`
  - `fromHour`, `updatedTimestamp`
  - `temperatureC`, `pressureHPA`, `windSpeedMps`, `humidityPercent`

## Current Providers

### MET Norway (met.no)

- API: `https://api.met.no/weatherapi/locationforecast/2.0/compact`
- Auth: No key
- Required env: `METNO_USER_AGENT`
- Coverage: Global model output
- Requirements:
  - Send descriptive User-Agent including contact per policy
  - Respect fair-use/rate limits
  - Keep attribution in docs/UI

### Open-Meteo

- API: `https://api.open-meteo.com/v1/forecast`
- Auth: No key for common endpoints
- Required env: none
- Coverage: Global
- Requirements:
  - Respect fair-use/rate limits
  - Keep attribution in docs/UI
  - Map WMO weather codes to internal symbol representation

## Candidate Agencies/Providers

### DWD (Germany)

- Data/API: DWD Open Data, MOSMIX products
- Auth: No key for open downloads
- Coverage: Germany + model products
- Requirements:
  - Parser for DWD file formats/products
  - Scheduled download + transform pipeline
  - Attribution and license text in API docs

### AEMET OpenData (Spain)

- Data/API: AEMET OpenData endpoints
- Auth: API key/token required
- Coverage: Spain
- Requirements:
  - `AEMET_API_KEY` env var
  - Retry/backoff for quota limits
  - Ensure allowed redistribution/usage terms

### MeteoFrance (France)

- Data/API: MeteoFrance open datasets/APIs
- Auth: Depends on endpoint
- Coverage: France + territories
- Requirements:
  - Endpoint-specific auth handling
  - Data product normalization to hourly fields
  - License/attribution compliance

### FMI (Finland)

- Data/API: FMI open data services
- Auth: endpoint-dependent
- Coverage: Finland region
- Requirements:
  - XML/JSON parser depending on endpoint
  - Rate-limit handling
  - Unit normalization to project schema

### Environment and Climate Change Canada (ECCC)

- Data/API: Open weather feeds and datasets
- Auth: usually open/public
- Coverage: Canada
- Requirements:
  - Parse selected feed format
  - Pick stable hourly product
  - Attribution in docs/license endpoint

### Met Éireann (Ireland)

- Data/API: Met Éireann public/open products
- Auth: endpoint-dependent
- Coverage: Ireland
- Requirements:
  - Confirm suitable machine-readable endpoint
  - Normalize timestamps to UTC hourly buckets
  - Add provider-specific license notice

### UK Met Office (DataPoint successor/open products)

- Data/API: UK Met Office APIs/datasets (current offering)
- Auth: typically token/key
- Coverage: UK
- Requirements:
  - `UKMO_API_KEY` env var
  - Updated endpoint support (legacy endpoints may be retired)
  - Quota and retry strategy

### NOAA / National Weather Service (USA)

- Data/API: NOAA/NWS endpoints
- Auth: usually no key, User-Agent required
- Coverage: USA
- Requirements:
  - `NWS_USER_AGENT` env var
  - Handle gridpoint/zone endpoint model
  - Respect rate limits and request etiquette

## Cross-Provider Requirements Checklist

- Legal:
  - Verify redistribution and attribution requirements
  - Add source entry in `/api/weather/license`
- Runtime:
  - Add required env vars to deployment config
  - Add retry/backoff and timeout
  - Add provider-specific logging and error counters
- Data quality:
  - Normalize units (C, hPa, m/s, %)
  - Normalize timestamps to UTC hourly
  - Ensure deterministic source id for DB grouping
- Operations:
  - Set safe city limit for provider quotas
  - Monitor ingestion success/errors per provider
  - Add feature flag in `HYF_PROVIDERS`
