# VISHRAMPATH
# VishraamPath (विश्रामपथ)

**The street that lets her rest.** A volunteer-surveyed senior-comfort and accessibility evidence system for Nagpur footpaths — local prototype by Team Zenith (Jeeya, Khudaija, Pratiksha, Shifa).

> **DEMO DATA notice:** every seeded record is labelled `DEMO DATA` / `demo_data: true`. This prototype is screening and decision support only — not accessibility certification, not medical advice, not a guarantee of safe travel. It has not been field-validated.

## What it demonstrates (one survey → two outputs)

NSS phone-survey records → AI suggestions (labelled fixtures) → **human confirm / reject / uncertain** → ~50 m segment records → versioned rule-pack screening ("Not assessed" stays visible) → **Marathi/Hindi gentler route** + **Fix-First repair queue** → **repeat-survey comparison**.

## Run it locally

**API (terminal 1), from the repo root:**

    python3 -m venv .venv && source .venv/bin/activate     # Windows: py -3.11 -m venv .venv; .\.venv\Scripts\Activate.ps1
    python -m pip install -r server/requirements.txt
    PYTHONPATH=server python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

**Website (terminal 2):**

    cd client
    npm install
    npm run dev

Open the URL Vite prints. Vite proxies `/api` to the local API.

**Tests:** `PYTHONPATH=server python -m pytest server/tests -q` and `cd client && npm run check && npm run build`

## Data & privacy

- `data/demo/` fixtures only. No raw image/video upload path exists — by design (privacy gate).
- No secrets, no real personal data, no unverified numbers are committed.
- Existing MIT `LICENSE` is unchanged.

## Docs

- `docs/prototype-plan/` — planning set: PRD, TRD, workflow, UI/UX brief, backend schema, implementation plan.
- `docs/presentation/` — demo script + pitch caveats.
- `docs/` — the 3-hour master build guide and this code file.


