# VishraamPath (विश्रामपथ)

**The street that lets her rest.** A volunteer-surveyed senior-comfort and accessibility evidence system concept for Nagpur footpaths by Team Zenith.

VishraamPath is designed to connect a street survey to two useful outputs: a gentler route for a senior or caregiver, and a traceable repair-planning record for the team that can act. This repository contains a **judge-facing workflow prototype**. Its persisted examples are illustrative demo data, not field observations.

> **Scope:** decision support only. Not an accessibility certification, medical advice, live navigation service, or guarantee of safe travel. No pilot or field survey has been completed in this prototype.

## Start locally

Requirements: Python 3.11+ and Node.js 20.19+.

**API (terminal 1, from repository root):**

```bash
python3 -m venv .venv
source .venv/bin/activate                 # Windows: .venv\Scripts\Activate.ps1
python -m pip install -r server/requirements.txt
PYTHONPATH=server python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Web app (terminal 2):**

```bash
cd client
npm ci
npm run dev
```

Open the local URL printed by Vite. Vite proxies `/api` to the local FastAPI service.

**Checks:**

```bash
# from repository root
source .venv/bin/activate
PYTHONPATH=server python -m pytest server/tests -q

# in client/
npm run check
npm run build
```

## Product walkthrough

The workspace presents the intended end-to-end loop:

1. **Survey a corridor:** create demo survey records and segment stubs. Field capture and media upload are deliberately disabled.
2. **Review suggestions:** save a human decision. The only seeded suggestion is a governance placeholder, not a YOLO/OpenCV inference or observed street condition.
3. **Screen a segment:** missing field evidence and an unverified rule pack remain **Not assessed**; numerical screening is withheld.
4. **Explore a gentler route:** choose walking-stick or wheelchair profile and Marathi or Hindi. The route is a hand-authored JSON fixture with no real locations or geometry. Browser text-to-speech can read the visible fixture text on supported devices. A separate Open-Meteo request supplies current **city-centre weather context only**; it does not alter route selection or assert corridor conditions.
5. **Fix-First queue:** only a human-confirmed demo item may be queued. Ordering is severity-only and advisory; costs stay blank without a source-backed estimate. CSV export is available.
6. **Re-survey & compare:** create demo surveys and link segments. A comparison or action note is not proof of a verified repair.

**Reset demo workspace** clears records explicitly marked `DEMO DATA` and restores the seed fixtures. It does not delete field-tagged records.

## Technology status

| Layer | In this repository today | Proposed, not wired here |
|---|---|---|
| Web app | React, TypeScript, Vite, Tailwind CSS | Leaflet map interface |
| API and storage | Python, FastAPI, REST endpoints, SQLite | PostgreSQL/PostGIS for scale |
| Map and routing | Leaflet city-centre context map; OpenStreetMap tiles with visible attribution | OSRM baseline routes, GraphHopper custom profiles, georeferenced route geometry, route selection |
| Route and weather context | Hand-authored route JSON; browser speech synthesis; Open-Meteo current conditions for the city-centre reference | Route-aware weather and official heat alerts |
| Survey and privacy | Demo forms; field capture and media upload disabled | Phone GPS/IMU, on-device face/plate blur, privacy QA |
| AI and language | Human-review workflow fixture; browser Web Speech synthesis for visible route text; no model inference | YOLO11, OpenCV, AI4Bharat IndicConformer speech-to-text, Piper TTS |
| Weather and reports | Open-Meteo current city-centre context (not a route safety input); no generated municipal report | Official heat alerts; versioned JSON rule packs; Jinja2 and WeasyPrint |

Runtime app components are connected to the local API. The city-context map and weather snapshot are separate from the illustrative route; neither creates street-level evidence or changes route selection. Route geometry, AI detections, field observations, route-specific weather, official heat alerts, verified accessibility rules, and engineering-grade repair estimates are **not** present. Technology named as proposed must not be described as a working feature. Open-Meteo and OpenStreetMap attribution are displayed in the app; external public services are best-effort and do not replace a production provider review.

## Data and safety boundaries

- Seeded records are labelled `DEMO DATA` / `demo_data: true` in the interface and API.
- No raw image or video upload endpoint exists. There is no camera capture in the web app.
- Survey permission defaults to unknown; the API does not allow demo forms to self-authorise a survey.
- Suggestions require a human decision: confirm, reject, or uncertain. Confidence is not proof.
- Only confirmed observations can enter the demo repair queue. A written action is not a verified repair.
- No numerical segment score is shown while the rule pack is draft-only and field evidence is absent.
- Repair cost fields stay blank without a cited quantity and rate. Priority is advisory, not ROI or a tender estimate.
- The route experience is illustrative, not live navigation or a safety guarantee.

## Team

**Team Zenith:** Jeeya Chavan, Khudaija Harmain, Pratiksha Bhatt, and Shifa Akbani.

SHRIJAN – AARAMBH ’26 · Ramdeobaba University · NSS Unit
