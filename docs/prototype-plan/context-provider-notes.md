# Context provider notes — prototype

The route demo now includes two lightweight context providers. Neither is evidence about an individual street or an input to routing or accessibility screening.

## OpenStreetMap / Leaflet

- The Leaflet map uses one view around an approximate Nagpur city-centre coordinate, `21.1466, 79.0889`, and a labelled contextual marker.
- Standard raster tiles are requested only for the visible view from `https://tile.openstreetmap.org/{z}/{x}/{y}.png`; the prototype does not prefetch or offer offline tile downloads.
- The map is non-interactive apart from a marker popup. No OSM routing, snapping, geocoding, or path geometry is used.
- Visible map attribution links to OpenStreetMap contributors and its copyright page.
- The standard OSM tile service is best-effort, with limited capacity and no service-level agreement. Review the official [Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) before expanding usage or choosing a production tile provider.

## Open-Meteo

- The client requests current model conditions for the same approximate city-centre coordinate: temperature, apparent temperature, relative humidity, and wind speed, in `Asia/Kolkata` local time.
- The card labels the output **city-centre model context** and states that it is not a corridor measurement, official heat alert, or route input. It never changes the fixture route or a screening status.
- The user can retry; the route remains independent if the provider is offline or blocks the request. Weather data is attributed to [Open-Meteo](https://open-meteo.com/) in the UI.
- The free/Open-Access API is intended for **non-commercial** use, has no uptime guarantee, and the service says its CC BY 4.0 weather data requires attribution. Check [current pricing and licensing](https://open-meteo.com/en/pricing) before public/commercial deployment.
- API fields and parameters follow the provider's [forecast API documentation](https://open-meteo.com/en/docs). The UI labels provider timestamps rather than treating a forecast-model update as a live station measurement.

## Production gate

Before any pilot or public rollout: obtain service-owner approval for an appropriate tile service and weather usage; verify the latest provider terms; define a contact and monitoring plan; confirm user notice/privacy implications; and keep route decisions blocked from using weather until the team defines, tests, and validates a transparent, locally appropriate rule. The current prototype does not meet that gate.
