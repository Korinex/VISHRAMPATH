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

export function CorridorMap({ corridor, originLabel, destinationLabel, activeSegmentIds }: { corridor: Corridor; originLabel: string; destinationLabel: string; activeSegmentIds: string[] }) {
  return (
    <section className="corridor-map-card" aria-labelledby="corridor-map-title">
      <div className="corridor-map-header">
        <div><span className="explainer-index">SEE THE SAME EVIDENCE ON A MAP</span><h3 id="corridor-map-title">{corridor.title}</h3></div>
        <span className="demo-map-label">SIMULATED MAP · NOT GPS</span>
      </div>
      <MapContainer className="corridor-map" center={corridor.center} zoom={corridor.zoom} scrollWheelZoom={false}>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>' />
        {corridor.segments.map((segment) => {
          const active = activeSegmentIds.includes(segment.id);
          return <Polyline key={segment.id} positions={segment.coordinates} pathOptions={{ color: segment.color, weight: active ? 10 : 5, opacity: active ? .95 : .25 }}><Popup><strong>{segment.label}</strong><br />{segment.evidence}<br /><em>{active ? "Selected sample option" : "Not part of the selected sample option"} · Not assessed as accessible</em></Popup></Polyline>;
        })}
        <CircleMarker center={corridor.origin} radius={8} pathOptions={{ color: "#fffefa", weight: 3, fillColor: "#252f2b", fillOpacity: 1 }}><Popup><strong>START</strong><br />{originLabel}<br /><em>Typed label only · not a GPS location</em></Popup></CircleMarker>
        <CircleMarker center={corridor.destination} radius={8} pathOptions={{ color: "#fffefa", weight: 3, fillColor: "#326c57", fillOpacity: 1 }}><Popup><strong>END</strong><br />{destinationLabel}<br /><em>Typed label only · not a GPS location</em></Popup></CircleMarker>
        {corridor.markers.map((marker) => <CircleMarker key={marker.id} center={marker.position} radius={7} pathOptions={{ color: "#fffefa", weight: 2, fillColor: marker.kind === "positive" ? "#326c57" : marker.kind === "unknown" ? "#ad7621" : "#a53b2e", fillOpacity: 1 }}><Popup><strong>{marker.label}</strong><br />Seeded demo marker · human review status is shown below.</Popup></CircleMarker>)}
      </MapContainer>
      <div className="corridor-map-legend" aria-label="Map legend"><span><i className="legend-swatch legend-swatch--green" /> Positive sample example</span><span><i className="legend-swatch legend-swatch--amber" /> Needs checking</span><span><i className="legend-swatch legend-swatch--red" /> Obstruction example</span></div>
      <p className="corridor-map-notice"><strong>Selected segments are shown brightly; other segments are faded.</strong> Your places change the start and end labels. {corridor.notice} The coloured line is a simulated teaching path, not a route from your home to your office. Open a segment to read the sample evidence.</p>
    </section>
  );
}
