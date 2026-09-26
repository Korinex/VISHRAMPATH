import { useEffect, useState } from "react";
import { SurveyForm } from "./features/survey/SurveyForm";
import { SegmentForm } from "./features/survey/SegmentForm";
import { RoutePlanner } from "./features/route/RoutePlanner";
import { ReviewInbox } from "./features/review/ReviewInbox";
import { RepairQueue } from "./features/repairs/RepairQueue";
import { RepeatComparison } from "./features/repairs/RepeatComparison";
import { WeatherContext } from "./features/route/WeatherContext";

type View = "overview" | "route" | "survey" | "review" | "repairs" | "repeat";
type Connection = "checking" | "connected" | "unavailable";
type Survey = {
  id: string;
  label: string;
  status: string;
  permission_status?: string;
  demo_data: boolean;
};
type SurveyList = { items: Survey[] };

const pages: Array<{ id: View; label: string; number: string; description: string }> = [
  { id: "overview", label: "Home", number: "01", description: "Start here" },
  { id: "route", label: "Plan a walk", number: "02", description: "For a senior or caregiver" },
  { id: "survey", label: "Add path information", number: "03", description: "For a volunteer" },
  { id: "review", label: "Check information", number: "04", description: "A person reviews it" },
  { id: "repairs", label: "Plan an improvement", number: "05", description: "For the team that can act" },
  { id: "repeat", label: "Check again", number: "06", description: "See what changed" },
];

function Wordmark() {
  return (
    <span className="wordmark">
      <span className="wordmark-symbol" aria-hidden="true"><i /><i /><i /></span>
      <span className="wordmark-copy"><strong>VishraamPath</strong><small>विश्रामपथ · TEAM ZENITH</small></span>
    </span>
  );
}

function Arrow() {
  return <span className="arrow" aria-hidden="true">↗</span>;
}

function StatusDot({ state }: { state: Connection }) {
  return <span className={`status-dot status-dot--${state}`} aria-hidden="true" />;
}

function CorridorSketch() {
  return (
    <div className="corridor-sketch" role="img" aria-label="Conceptual diagram of a footpath segment with a broken surface, a clear route, shade, and a rest point. This is not a mapped Nagpur street or a field survey.">
      <svg viewBox="0 0 760 276" aria-hidden="true" focusable="false">
        <rect x="0" y="0" width="760" height="276" fill="#eee9dc" />
        <path d="M0 42H760" stroke="#d9d1c2" strokeWidth="2" strokeDasharray="7 8" />
        <path d="M0 226H760" stroke="#d9d1c2" strokeWidth="2" strokeDasharray="7 8" />
        <path d="M0 88H760V194H0Z" fill="#d6d5ca" />
        <path d="M0 88H760" stroke="#bbb9ae" strokeWidth="2" />
        <path d="M0 194H760" stroke="#bbb9ae" strokeWidth="2" />
        <path d="M34 140H714" stroke="#326c57" strokeWidth="8" strokeLinecap="square" strokeDasharray="2 0" />
        <path d="M34 140H214" stroke="#a53b2e" strokeWidth="8" />
        <path d="M214 140H402" stroke="#d39c36" strokeWidth="8" />
        <path d="M402 140H714" stroke="#326c57" strokeWidth="8" />
        <path d="M226 108l26 22-17 24 28 22-27 18" fill="none" stroke="#a53b2e" strokeWidth="5" strokeLinejoin="round" />
        <rect x="496" y="78" width="30" height="38" fill="#44634f" />
        <path d="M511 77V51M480 53h62" stroke="#44634f" strokeWidth="4" />
        <path d="M465 72l47-21 48 21" fill="#d9e2d2" stroke="#44634f" strokeWidth="3" />
        <path d="M617 104h38m-32 0v20m26-20v20m-33 0h39" stroke="#263b35" strokeWidth="4" strokeLinecap="square" />
        <circle cx="638" cy="93" r="9" fill="#c5a26c" />
        <path d="M638 102v13m-8 8 8-7 8 7" fill="none" stroke="#263b35" strokeWidth="3" strokeLinecap="square" />
        <circle cx="229" cy="104" r="14" fill="#fff9ed" stroke="#a53b2e" strokeWidth="3" />
        <text x="229" y="109" textAnchor="middle" fill="#a53b2e" fontSize="14" fontWeight="700">!</text>
        <circle cx="408" cy="140" r="9" fill="#fff9ed" stroke="#ad7621" strokeWidth="3" />
        <path d="M63 99h122M273 103h144M542 96h107" stroke="#9d998b" strokeWidth="1" strokeDasharray="3 4" />
      </svg>
      <div className="sketch-label sketch-label--one"><span className="sketch-index">01</span><span>Surface<br />condition</span></div>
      <div className="sketch-label sketch-label--two"><span className="sketch-index">02</span><span>Shade &<br />rest</span></div>
      <div className="sketch-label sketch-label--three"><span className="sketch-index">03</span><span>Human-reviewed<br />route segment</span></div>
      <div className="sketch-caption">CONCEPT DIAGRAM · NOT A MAP · NO STREET CONDITION CLAIMED</div>
    </div>
  );
}

function StackCard({ title, status, detail, state }: { title: string; status: string; detail: string; state: "active" | "fixture" | "planned" }) {
  return (
    <article className={`stack-card stack-card--${state}`}>
      <div className="stack-card-top"><span className={`stack-indicator stack-indicator--${state}`} /> <span>{status}</span></div>
      <h3>{title}</h3>
      <p>{detail}</p>
    </article>
  );
}

function Overview({ onNavigate, connection, surveyCount }: { onNavigate: (view: View) => void; connection: Connection; surveyCount: number }) {
  const [judgeMode, setJudgeMode] = useState(false);
  return (
    <div className="view-stack">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-square" /> A CALMER WAY TO WALK IN NAGPUR</p>
          <h1>A calmer route<br /><em>for everyday walking.</em></h1>
          <p className="hero-lede">Choose how you walk and the language you prefer. VishraamPath shows sample route choices in simple words and clearly tells you what still needs checking.</p>
          <div className="hero-actions">
            <button className="button button--dark" type="button" onClick={() => onNavigate("route")}>Plan my route <Arrow /></button>
            <button className="button button--outline" type="button" onClick={() => setJudgeMode((open) => !open)}>{judgeMode ? "Close judge walkthrough" : "Run the 3-minute demo"}</button>
            <button className="text-button" type="button" onClick={() => onNavigate("survey")}>See how information is added <span aria-hidden="true">→</span></button>
          </div>
          <p className="hero-note"><span className="live-pip" /> PROTOTYPE WORKSPACE <span className="hero-note-divider">/</span> DEMO DATA ONLY</p>
        </div>
        <div className="hero-illustration">
          <div className="illustration-heading"><span>ONE CORRIDOR · TWO OUTCOMES</span><span>VISHRAAMPATH / 01</span></div>
          <CorridorSketch />
          <div className="illustration-footer"><span>Evidence → a gentler route → an actionable repair record</span><span>Concept only</span></div>
        </div>
      </section>

      {judgeMode && <section className="judge-walkthrough" aria-labelledby="judge-walkthrough-title">
        <div><p className="eyebrow">JUDGE MODE · FOLLOW ONE RECORD</p><h2 id="judge-walkthrough-title">See the same segment move through the product.</h2><p>Use the four steps below. Each opens a working prototype screen and keeps the demo boundaries visible.</p></div>
        <div className="judge-steps">
          {[{ view: "route" as View, number: "01", title: "Plan a route", detail: "See the seeded corridor map and choose a sample option." }, { view: "review" as View, number: "02", title: "Review evidence", detail: "Confirm, reject, or mark an illustrative suggestion uncertain." }, { view: "repairs" as View, number: "03", title: "Create a Fix-First item", detail: "Send a confirmed observation to the advisory queue." }, { view: "repeat" as View, number: "04", title: "Check again", detail: "Link a repeat survey before calling anything verified." }].map((step) => <button type="button" key={step.view} className="judge-step" onClick={() => onNavigate(step.view)}><span>{step.number}</span><strong>{step.title}</strong><small>{step.detail}</small><i aria-hidden="true">→</i></button>)}
        </div>
      </section>}

      <section className="truth-strip" aria-label="Prototype boundaries">
        <div className="truth-icon" aria-hidden="true">i</div>
        <div><strong>What you are seeing</strong><p>Every record here is illustrative. This is a decision-support prototype, not an accessibility certification or a guarantee of safe travel.</p></div>
        <div className="truth-connection"><StatusDot state={connection} /> <span>{connection === "connected" ? "Local API connected" : connection === "checking" ? "Checking local API" : "Local API unavailable"}</span></div>
      </section>

      <section className="workflow-section">
        <div className="section-head"><div><p className="eyebrow">THE PRODUCT LOOP</p><h2>One survey. A useful next step for everyone.</h2></div><span className="section-side-note">Same segment evidence flows through both sides.</span></div>
        <div className="loop-grid">
          <article className="loop-card loop-card--citizen">
            <div className="loop-card-index">01 / FOR A SENIOR OR CAREGIVER</div>
            <h3>A route with difficult parts called out.</h3>
            <p>Choose how you walk and your language. See the sample map, read the warnings, and hear the steps if your browser supports speech.</p>
            <button className="inline-link" type="button" onClick={() => onNavigate("route")}>Plan a sample walk <Arrow /></button>
          </article>
          <article className="loop-card loop-card--city">
            <div className="loop-card-index">02 / FOR THE TEAM THAT CAN ACT</div>
            <h3>Information that a person checks first.</h3>
            <p>A sample finding is never treated as truth automatically. A person checks it, the team can plan a next step, and a second check is needed before calling anything fixed.</p>
            <button className="inline-link" type="button" onClick={() => onNavigate("review")}>Check sample information <Arrow /></button>
          </article>
        </div>
      </section>

      <section className="workflow-rail" aria-label="End-to-end prototype sequence">
        <div className="rail-heading"><p className="eyebrow">END-TO-END WORKFLOW</p><span>Each step is accessible from the left navigation.</span></div>
        <div className="rail-steps">
          {pages.slice(2).map((page, index) => <button type="button" key={page.id} className="rail-step" onClick={() => onNavigate(page.id)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{page.label}</strong><i aria-hidden="true">→</i></button>)}
        </div>
      </section>

      <section className="system-section">
        <div className="section-head"><div><p className="eyebrow">TECHNOLOGY, HONESTLY LABELLED</p><h2>Built now. Demonstrated with fixtures. Planned for the field.</h2></div><p className="section-side-note section-side-note--wide">The presentation stack and this code prototype are not the same thing. The cards below make that explicit.</p></div>
        <div className="stack-grid">
          <StackCard state="active" status="RUNNING IN THIS PROTOTYPE" title="React · TypeScript · Vite · Tailwind · FastAPI" detail="Python REST API and React interface run locally; SQLite stores demo workflow state. Review decisions, route fixture requests, repair actions, CSV export, repeat links, browser text-to-speech, and Open-Meteo city-centre weather context are wired." />
          <StackCard state="fixture" status="SEEDED MAP / ROUTING NOT LIVE" title="Leaflet · OpenStreetMap · seeded corridor geometry" detail="Leaflet now renders a bounded illustrative corridor with four coloured segments, evidence markers, and visible attribution. OSRM/GraphHopper routing is not connected; geometry and route options remain hand-authored demo data." />
          <StackCard state="planned" status="PROPOSED FOR PILOT / NOT WIRED HERE" title="YOLO11 · OpenCV · IndicConformer" detail="Also proposed: phone GPS/IMU, on-device face/plate blur, official heat alerts, versioned JSON rule packs, AI4Bharat speech-to-text, Piper TTS, Jinja2/WeasyPrint reports, and PostgreSQL/PostGIS at scale. These need implementation, permissions, and validation." />
        </div>
        <div className="tech-footnote"><span>SCREENING RULE PACK: DRAFT · score withheld · status stays “Not assessed”</span><span>FIELD DATA: NOT COLLECTED · media capture disabled</span><span>RECORDS IN THIS DEMO: {surveyCount}</span></div>
      </section>

      <section className="pilot-note">
        <div className="pilot-number">NAGPUR<br />PILOT CONCEPT</div>
        <div><h3>From a 1–2 km volunteer survey to a re-checkable street record.</h3><p>Proposed pilot: authorised phone survey, georeferenced segments of approximately 50 m, on-device privacy blur before upload, human review, a versioned screening ruleset, and repeat survey. Permission and field validation are still required.</p></div>
        <button className="button button--outline" type="button" onClick={() => onNavigate("survey")}>Open survey workspace <Arrow /></button>
      </section>
    </div>
  );
}

function PageIntro({ kicker, title, description }: { kicker: string; title: string; description: string }) {
  return <div className="view-intro"><p className="eyebrow">{kicker}</p><h1>{title}</h1><p>{description}</p></div>;
}

function DemoResetButton({ onReset, disabled }: { onReset: () => void; disabled: boolean }) {
  return <button className="button button--reset" type="button" onClick={onReset} disabled={disabled} title="Clears only records labelled demo data; never field data."><span aria-hidden="true">↺</span> Reset demo workspace</button>;
}

export default function App() {
  const [view, setView] = useState<View>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [connection, setConnection] = useState<Connection>("checking");
  const [surveyList, setSurveyList] = useState<SurveyList>({ items: [] });
  const [resetMessage, setResetMessage] = useState("");
  const [resetting, setResetting] = useState(false);
  const [workspaceRevision, setWorkspaceRevision] = useState(0);

  async function refreshWorkspace() {
    try {
      const [metaResponse, surveysResponse] = await Promise.all([fetch("/api/v1/meta"), fetch("/api/v1/surveys")]);
      if (!metaResponse.ok || !surveysResponse.ok) throw new Error("Local API unavailable");
      const meta = await metaResponse.json() as { data_status: string; field_data_status: string; field_capture_enabled: boolean };
      const surveys = await surveysResponse.json() as SurveyList;
      setSurveyList(surveys);
      setConnection(meta.data_status === "demo_fixture_only" && meta.field_data_status === "not_collected" && meta.field_capture_enabled === false ? "connected" : "unavailable");
    } catch {
      setConnection("unavailable");
    }
  }

  useEffect(() => { void refreshWorkspace(); }, []);

  async function resetDemoWorkspace() {
    setResetting(true);
    setResetMessage("");
    try {
      const response = await fetch("/api/v1/demo/reset", { method: "POST" });
      if (!response.ok) throw new Error("Reset failed");
      const result = await response.json() as { status?: string; data_status?: string; field_data_status?: string };
      await refreshWorkspace();
      setWorkspaceRevision((revision) => revision + 1);
      setResetMessage(result.field_data_status === "not_collected" ? "Demo workspace reset. Only records labelled DEMO DATA were cleared; no field records were changed." : "The reset completed but the local data-safety status could not be verified.");
    } catch {
      setResetMessage("Could not confirm the reset. Refresh and check the local API before continuing.");
    } finally {
      setResetting(false);
    }
  }

  function navigate(next: View) {
    setView(next);
    setMobileMenuOpen(false);
    setResetMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const page = pages.find((item) => item.id === view) ?? pages[0];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-row"><button className="brand-home" type="button" onClick={() => navigate("overview")} aria-label="VishraamPath overview"><Wordmark /></button><button className="mobile-menu-toggle" type="button" onClick={() => setMobileMenuOpen((open) => !open)} aria-expanded={mobileMenuOpen} aria-controls="product-navigation">{mobileMenuOpen ? "Close" : "Menu"}</button></div>
        <div className="sidebar-context"><span className="context-mark" /> <span>NAGPUR / PROTOTYPE</span></div>
        <nav id="product-navigation" className={`side-nav ${mobileMenuOpen ? "side-nav--open" : ""}`} aria-label="Product workspace">
          <p className="nav-heading">WORKSPACE</p>
          {pages.map((item) => <button key={item.id} type="button" onClick={() => navigate(item.id)} className={`nav-item ${view === item.id ? "nav-item--active" : ""}`} aria-current={view === item.id ? "page" : undefined}><span className="nav-number">{item.number}</span><span className="nav-label">{item.label}<small>{item.description}</small></span><span className="nav-chevron" aria-hidden="true">›</span></button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="team-tag"><span>TEAM ZENITH</span><strong>Jeeya · Khudaija<br />Pratiksha · Shifa</strong></div>
          <div className="sidebar-status"><StatusDot state={connection} /><span>{connection === "connected" ? "API available" : connection === "checking" ? "Connecting" : "API unavailable"}</span></div>
          <span className="sidebar-version">SHRIJAN · AARAMBH ’26</span>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs"><span>VishraamPath</span><span aria-hidden="true">/</span><strong>{page.label}</strong></div>
          <div className="topbar-right"><span className="environment-tag"><i /> LOCAL DEMO</span><DemoResetButton onReset={() => void resetDemoWorkspace()} disabled={connection !== "connected" || resetting} /></div>
        </header>
        <main className="main-content">
          <div className="demo-banner"><span className="demo-banner-mark">!</span><span><strong>DEMO DATA</strong> Workflow records are illustrative, not field-validated. No camera, media upload, or live street route is active. Map and weather are city-context only.</span><a href="https://github.com/Korinex/VISHRAMPATH" target="_blank" rel="noreferrer">Project repository <Arrow /></a></div>
          {resetMessage && <p className="reset-message" role="status">{resetMessage}</p>}

          {view === "overview" && <Overview onNavigate={navigate} connection={connection} surveyCount={surveyList.items.filter((item) => item.demo_data).length} />}

          {view === "route" && <div className="view-stack"><PageIntro kicker="FOR A SENIOR OR CAREGIVER" title="Plan a sample walk." description="Choose how you walk and the language you prefer. The map and route choices are easy to read, and anything that still needs checking is clearly marked." /><div className="feature-layout"><div className="feature-main"><RoutePlanner /></div><aside className="side-explainer"><span className="explainer-index">HELP FOR THIS STEP</span><h3>Simple route choices.</h3><ul><li>Choose walking with a stick or using a wheelchair.</li><li>Read the information in Marathi or Hindi.</li><li>Hear the sample steps on supported devices.</li><li>Remember: this is a demonstration, not live navigation.</li></ul><div className="side-explainer-note">The sample map does not promise a safe or accessible route.</div><WeatherContext /></aside></div></div>}

          {view === "survey" && <div className="view-stack"><PageIntro kicker="FOR A VOLUNTEER" title="Add information about the path." description="Create sample survey records and path sections to see how information moves to the checking screen. Real phone capture and media upload are not turned on in this demonstration." /><div className="capture-guard"><div className="guard-symbol" aria-hidden="true">!</div><div><strong>Real-world recording is turned off.</strong><p>These forms save sample information only. Do not enter personal details, exact locations, or unblurred photos.</p></div><span>PERMISSION NOT RECORDED</span></div><div className="feature-layout feature-layout--stack"><div className="feature-main survey-forms"><SurveyForm key={`survey-form-${workspaceRevision}`} onCreated={() => void refreshWorkspace()} /><SegmentForm key={`segment-form-${workspaceRevision}`} surveys={surveyList.items.filter((item) => item.demo_data)} /></div><aside className="side-explainer"><span className="explainer-index">HOW A REAL PILOT WOULD WORK</span><h3>Collect only useful information.</h3><ol><li>Get permission before visiting a path.</li><li>Record each short path section.</li><li>Remove faces and number plates before sharing media.</li><li>Ask a person to check the information.</li></ol><div className="side-explainer-note">Camera, video upload, and phone location are not connected here.</div></aside></div></div>}

          {view === "review" && <div className="view-stack"><PageIntro kicker="FOR THE PERSON CHECKING THE INFORMATION" title="Check each finding before using it." description="A sample note is not automatically true. Read each finding, then tell us whether it looks correct, is not correct, or needs more information." /><div className="review-principle"><span className="principle-step">SAMPLE NOTE</span><span aria-hidden="true">→</span><span className="principle-step principle-step--human">PERSON CHECKS</span><span aria-hidden="true">→</span><span className="principle-step">NEXT STEP</span><span className="principle-outcome">No confirmed field information → “We still need to check”</span></div><div className="feature-layout"><div className="feature-main"><ReviewInbox key={`review-${workspaceRevision}`} /></div><aside className="side-explainer"><span className="explainer-index">CURRENT ANSWER</span><div className="not-assessed"><span>?</span><strong>We still need to check</strong><small>NO FIELD RECORDING</small></div><p className="aside-copy">The checking rules are still a draft. Missing information does not become a pass.</p><div className="side-explainer-note">A person must decide before an improvement is planned.</div></aside></div></div>}

          {view === "repairs" && <div className="view-stack"><PageIntro kicker="FOR THE TEAM THAT CAN ACT" title="Choose what to improve first." description="Only information checked by a person can enter this planning list. It is a helpful starting point, not a work order or a cost estimate." /><div className="queue-facts"><div><span>HOW WE ORDER</span><strong>Most serious first</strong></div><div><span>COST</span><strong>Not entered yet</strong></div><div><span>CHECK AGAIN</span><strong>Required after action</strong></div><a href="/api/v1/repair-queue.csv" className="button button--outline" target="_blank" rel="noreferrer">Download list <Arrow /></a><a href="/api/v1/repair-queue/report.html" className="button button--outline" target="_blank" rel="noreferrer">Open printable list <Arrow /></a></div><div className="feature-main feature-main--full"><RepairQueue key={`repairs-${workspaceRevision}`} /></div></div>}

          {view === "repeat" && <div className="view-stack"><PageIntro kicker="CLOSE THE LOOP" title="Check again before calling it fixed." description="Link a later demo survey to the same segment and keep the uncertainty visible. A saved comparison documents the workflow; it does not prove a repair is complete." /><div className="repeat-sequence"><span>BASELINE</span><i aria-hidden="true">→</i><span>INTERVENTION</span><i aria-hidden="true">→</i><span>RE-SURVEY</span><i aria-hidden="true">→</i><strong>VERIFIED ONLY AFTER RE-CHECK</strong></div><div className="feature-main feature-main--full"><RepeatComparison key={`repeat-${workspaceRevision}`} /></div><div className="repeat-boundary"><strong>Important distinction</strong><span>Recording an action is not the same as confirming the route is improved. Re-survey remains the real check.</span></div></div>}

          <footer className="main-footer"><span>VISHRAAMPATH / TEAM ZENITH</span><span>Decision support, not accessibility certification.</span><span>LOCAL PROTOTYPE · DEMO DATA ONLY</span></footer>
        </main>
      </div>
    </div>
  );
}
