import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type CurrentWeather = {
  time: string;
  temperature_2m: number | null;
  apparent_temperature: number | null;
  relative_humidity_2m: number | null;
  wind_speed_10m: number | null;
};

type WeatherResponse = {
  current?: CurrentWeather;
  current_units?: Record<string, string>;
};

const WEATHER_URL = "https://api.open-meteo.com/v1/forecast?latitude=21.1466&longitude=79.0889&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m&timezone=Asia%2FKolkata";
const NAGPUR_CENTRE: [number, number] = [21.1466, 79.0889];

function formatValue(value: number | null | undefined, unit: string | undefined) {
  return value == null ? "—" : `${Math.round(value * 10) / 10}${unit ? ` ${unit}` : ""}`;
}

export function WeatherContext() {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [message, setMessage] = useState("Loading current city context…");
  const [loading, setLoading] = useState(true);

  async function loadWeather() {
    setLoading(true);
    setMessage("Loading current city context…");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(WEATHER_URL, { signal: controller.signal, cache: "no-store" });
      if (!response.ok) throw new Error("Weather provider is temporarily unavailable.");
      const result = await response.json() as WeatherResponse;
      if (!result.current) throw new Error("Current weather was not included in the provider response.");
      setWeather(result);
      setMessage("");
    } catch (error) {
      setWeather(null);
      setMessage(error instanceof DOMException && error.name === "AbortError"
        ? "Weather request timed out. Retry when online; route guidance does not depend on this service."
        : error instanceof Error
          ? `${error.message} Route guidance does not depend on this service.`
          : "Weather is unavailable. Route guidance does not depend on this service.");
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWeather();
    return () => window.speechSynthesis?.cancel();
  }, []);

  return (
    <section className="weather-context" aria-labelledby="weather-context-title">
      <div className="weather-context-header">
        <div><span className="explainer-index">OPTIONAL CITY CONTEXT</span><h3 id="weather-context-title">Nagpur weather snapshot</h3></div>
        <button type="button" className="weather-refresh" onClick={() => void loadWeather()} disabled={loading}>{loading ? "Checking…" : "Refresh"}</button>
      </div>
      <MapContainer className="nagpur-context-map" center={NAGPUR_CENTRE} zoom={13} zoomControl={false} scrollWheelZoom={false} dragging={false} touchZoom={false} doubleClickZoom={false} keyboard={false}>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>' />
        <CircleMarker center={NAGPUR_CENTRE} radius={5} pathOptions={{ color: "#f7f4ec", weight: 2, fillColor: "#b05c43", fillOpacity: 1 }}>
          <Popup>Nagpur city-centre reference only. Not a route endpoint or surveyed corridor.</Popup>
        </CircleMarker>
      </MapContainer>
      {weather?.current ? <>
        <p className="weather-context-time">Current model conditions · {weather.current.time.replace("T", " ")} IST</p>
        <div className="weather-current-temperature">{formatValue(weather.current.temperature_2m, weather.current_units?.temperature_2m)}</div>
        <div className="weather-metrics">
          <div><span>Feels like</span><strong>{formatValue(weather.current.apparent_temperature, weather.current_units?.apparent_temperature)}</strong></div>
          <div><span>Humidity</span><strong>{formatValue(weather.current.relative_humidity_2m, weather.current_units?.relative_humidity_2m)}</strong></div>
          <div><span>Wind</span><strong>{formatValue(weather.current.wind_speed_10m, weather.current_units?.wind_speed_10m)}</strong></div>
        </div>
      </> : <p className="weather-context-message" role="status">{message}</p>}
      <p className="weather-context-boundary">City-centre model context only (approx. 21.1466° N, 79.0889° E); not a corridor measurement or official heat alert. It does not score or change this sample route.</p>
      <p className="weather-attribution">Source: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> · weather data CC BY 4.0</p>
    </section>
  );
}
