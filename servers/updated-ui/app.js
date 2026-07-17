import { h, render } from "https://esm.sh/preact@10.26.9";
import { useEffect, useMemo, useState } from "https://esm.sh/preact@10.26.9/hooks";
import htm from "https://esm.sh/htm@3.1.1";

const html = htm.bind(h);

function Card({ title, children }) {
  return html`<section class="card"><h2>${title}</h2>${children}</section>`;
}

function Sparkline({ values = [], color = "#0f766e" }) {
  const width = 220;
  const height = 64;
  if (!values.length) return html`<p class="kpi">No trend data yet.</p>`;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : width;

  const points = values
    .map((value, idx) => {
      const x = idx * step;
      const y = height - ((value - min) / range) * (height - 10) - 5;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return html`
    <svg class="spark" viewBox=${`0 0 ${width} ${height}`} role="img" aria-label="Trend sparkline">
      <polyline points=${points} fill="none" stroke=${color} stroke-width="2.5" stroke-linecap="round" />
    </svg>
  `;
}

function UpdatedApp() {
  const [sources, setSources] = useState([]);
  const [total, setTotal] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [health, setHealth] = useState(null);
  const [err, setErr] = useState("");
  const [weatherResponse, setWeatherResponse] = useState(null);
  const [lat, setLat] = useState("52.3676");
  const [lng, setLng] = useState("4.9041");
  const [timestamp, setTimestamp] = useState(String(Math.floor(Date.now() / 1000)));

  async function loadOverview() {
    setErr("");
    try {
      const [h, s, t, groupedResp] = await Promise.all([
        fetch("/healthz").then(r => r.json()),
        fetch("/api/stats/list").then(r => r.json()),
        fetch("/api/stats/total").then(r => r.json()),
        fetch("/api/stats/").then(r => r.json())
      ]);
      setHealth(h);
      setSources(s.sources || []);
      setTotal(Array.isArray(t) ? t : []);
      setGrouped(groupedResp && typeof groupedResp === "object" ? groupedResp : {});
    } catch (e) {
      setErr(e.message || "Failed to load overview data");
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  const latest = useMemo(() => (total.length ? total[0] : null), [total]);
  const trendTemp = useMemo(
    () => total.slice(0, 24).map(item => Number(item.sumOfTempC || 0)).reverse(),
    [total]
  );
  const trendWind = useMemo(
    () => total.slice(0, 24).map(item => Number(item.sumOfWindMps || 0)).reverse(),
    [total]
  );
  const trendPressure = useMemo(
    () => total.slice(0, 24).map(item => Number(item.sumOfPressureHPA || 0)).reverse(),
    [total]
  );
  const sourceRows = useMemo(
    () =>
      sources
        .map(source => ({
          source,
          latest: Array.isArray(grouped[source]) && grouped[source].length ? grouped[source][0] : null
        }))
        .filter(item => item.latest),
    [sources, grouped]
  );

  async function runWeatherCheck(e) {
    e.preventDefault();
    setErr("");
    setWeatherResponse(null);
    try {
      const payload = {
        locations: [
          {
            lat: Number(lat),
            lng: Number(lng),
            timestamp: Number(timestamp)
          }
        ]
      };
      const response = await fetch("/api/weather", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      setWeatherResponse(data);
    } catch (e) {
      setErr(e.message || "Weather request failed");
    }
  }

  return html`
    <main class="wrap">
      <div class="top">
        <div>
          <span class="badge">Updated Frontend · Preact</span>
          <h1>HackYourForecast</h1>
        </div>
        <a href="/">Back to chooser</a>
      </div>
      <p class="sub">
        Lightweight modern frontend for API testing and ingestion health.
        Legacy pages remain available under <a href="/legacy">/legacy</a>.
      </p>

      ${err ? html`<p class="err">${err}</p>` : null}

      <section class="grid">
        ${html`<section class="card">
          <h2>System status</h2>
          <p class="kpi">${health?.ok ? html`<span class="pill">Healthy</span>` : "Loading..."}</p>
          <p class="kpi">Service: ${health?.service || "-"}</p>
          <p class="kpi">Sources: ${sources.length ? sources.join(", ") : "-"}</p>
          <p class="kpi">Rows in total stats: ${total.length || 0}</p>
          <div class="chips">
            ${sources.length
              ? sources.map(src => html`<span class="chip">${src}</span>`)
              : html`<span class="chip">no sources</span>`}
          </div>
          <button class="secondary" onClick=${loadOverview}>Refresh overview</button>
        </section>`}

        ${html`<section class="card">
          <h2>Latest aggregate</h2>
          ${latest
            ? html`
                <p class="kpi">Run timestamp: ${latest.runTimeStamp}</p>
                <p class="kpi">City points: ${latest.countOfItems}</p>
                <p class="kpi">Temp sum: ${latest.sumOfTempC?.toFixed?.(2) ?? latest.sumOfTempC}</p>
                <p class="kpi">Wind sum: ${latest.sumOfWindMps?.toFixed?.(2) ?? latest.sumOfWindMps}</p>
                <p class="kpi">Pressure sum: ${latest.sumOfPressureHPA?.toFixed?.(2) ?? latest.sumOfPressureHPA}</p>
              `
            : html`<p class="kpi">No aggregate rows yet.</p>`}
        </section>`}
      </section>

      <section class="grid" style=${{ marginTop: "14px" }}>
        ${html`<section class="card">
          <h2>Temperature trend (24 points)</h2>
          <${Sparkline} values=${trendTemp} color="#0f766e" />
        </section>`}
        ${html`<section class="card">
          <h2>Wind trend (24 points)</h2>
          <${Sparkline} values=${trendWind} color="#1d4ed8" />
        </section>`}
        ${html`<section class="card">
          <h2>Pressure trend (24 points)</h2>
          <${Sparkline} values=${trendPressure} color="#ea580c" />
        </section>`}
      </section>

      <section class="card" style=${{ marginTop: "14px" }}>
        <h2>Providers snapshot</h2>
        ${sourceRows.length
          ? html`<div class="provider-list">
              ${sourceRows.map(
                item => html`<article class="provider-item">
                  <h3>${item.source}</h3>
                  <p class="kpi">Run: ${item.latest.runTimeStamp}</p>
                  <p class="kpi">Points: ${item.latest.countOfItems}</p>
                </article>`
              )}
            </div>`
          : html`<p class="kpi">Provider rows unavailable yet.</p>`}
      </section>

      <section class="card" style=${{ marginTop: "14px" }}>
        <h2>Weather API quick test</h2>
        <form class="form" onSubmit=${runWeatherCheck}>
          <div class="fields">
            <input value=${lat} onInput=${e => setLat(e.target.value)} placeholder="Latitude" />
            <input value=${lng} onInput=${e => setLng(e.target.value)} placeholder="Longitude" />
            <input value=${timestamp} onInput=${e => setTimestamp(e.target.value)} placeholder="Unix timestamp" />
          </div>
          <button>Call /api/weather</button>
        </form>
        ${weatherResponse
          ? html`<pre>${JSON.stringify(weatherResponse, null, 2)}</pre>`
          : html`<p class="kpi">Submit to inspect API payload and response.</p>`}
      </section>
    </main>
  `;
}

function mount() {
  const root = document.getElementById("app");
  render(html`<${UpdatedApp} />`, root);
}

mount();
