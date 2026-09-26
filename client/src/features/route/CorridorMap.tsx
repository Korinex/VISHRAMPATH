import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from "react-leaflet";

type Coordinate = [number, number];
export type Corridor = {
  title: string;
  notice: string;
  center: Coordinate;
  zoom: number;
  origin: Coordinate;
  destination: Coordinate;
  segments: Array<{ id: string; label: string; status: string; color: string; coordinates: Coordinate[]; evidence: string }>;
  markers: Array<{ id: string; position: Coordinate; label: string; kind: string }>;
};

export function CorridorMap({ corridor }: { corridor: Corridor }) {
  return (
    <section className="corridor-map-card" aria-labelledby="corridor-map-title">
      <div className="corridor-map-header">
        <div><span className="explainer-index">SEE THE SAME EVIDENCE ON A MAP</span><h3 id="corridor-map-title">{corridor.title}</h3></div>
        <span className="demo-map-label">ILLUSTRATIVE GEOMETRY</span>
      </div>
      <MapContainer className="corridor-map" center={corridor.center} zoom={corridor.zoom} scrollWheelZoom={false}>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>' />
        {corridor.segments.map((segment) => <Polyline key={segment.id} positions={segment.coordinates} pathOptions={{ color: segment.color, weight: 9, opacity: .9 }}><Popup><strong>{segment.label}</strong><br />{segment.evidence}<br /><em>DEMO DATA · Not assessed as accessible</em></Popup></Polyline>)}
        <CircleMarker center={corridor.origin} radius={8} pathOptions={{ color: "#fffefa", weight: 3, fillColor: "#252f2b", fillOpacity: 1 }}><Popup>Demo starting point. No real location is claimed.</Popup></CircleMarker>
        <CircleMarker center={corridor.destination} radius={8} pathOptions={{ color: "#fffefa", weight: 3, fillColor: "#326c57", fillOpacity: 1 }}><Popup>Demo destination. No real location is claimed.</Popup></CircleMarker>
        {corridor.markers.map((marker) => <CircleMarker key={marker.id} center={marker.position} radius={7} pathOptions={{ color: "#fffefa", weight: 2, fillColor: marker.kind === "positive" ? "#326c57" : marker.kind === "unknown" ? "#ad7621" : "#a53b2e", fillOpacity: 1 }}><Popup><strong>{marker.label}</strong><br />Seeded demo marker · human review status is shown below.</Popup></CircleMarker>)}
      </MapContainer>
      <div className="corridor-map-legend" aria-label="Map legend"><span><i className="legend-swatch legend-swatch--green" /> Confirmed demo evidence</span><span><i className="legend-swatch legend-swatch--amber" /> Uncertain / not assessed</span><span><i className="legend-swatch legend-swatch--red" /> Obstruction example</span></div>
      <p className="corridor-map-notice">{corridor.notice} Open the coloured segments to read their evidence.</p>
    </section>
  );
}
