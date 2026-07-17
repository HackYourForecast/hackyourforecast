import { h, render } from "https://esm.sh/preact@10.26.9";
import { useEffect, useMemo, useState } from "https://esm.sh/preact@10.26.9/hooks";
import htm from "https://esm.sh/htm@3.1.1";

const html = htm.bind(h);

function Card({ title, children }) {
  return html`<section class="card"><h2>${title}</h2>${children}</section>`;
}

function UpdatedApp() {
  const [sources, setSources] = useState([]);
  const [total, setTotal] = useState([]);
  const [health, setHealth] = useState(null);
  const [err, setErr] = useState("");
  const [weatherResponse, setWeatherResponse] = useState(null);
  const [lat, setLat] = useState("52.3676");
  const [lng, setLng] = useState("4.9041");
  const [timestamp, setTimestamp] = useState(String(Math.floor(Date.now() / 1000)));

  async function loadOverview() {
    setErr("");
    try {
      const [h, s, t] = await Promise.all([
        fetch("/healthz").then(r => r.json()),
        fetch("/api/stats/list").then(r => r.json()),
        fetch("/api/stats/total").then(r => r.json())
      ]);
      setHealth(h);
      setSources(s.sources || []);
      setTotal(Array.isArray(t) ? t : []);
    } catch (e) {
      setErr(e.message || "Failed to load overview data");
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  const latest = useMemo(() => (total.length ? total[0] : null), [total]);

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
