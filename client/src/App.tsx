import { useEffect, useState } from "react";
import { SegmentForm } from "./features/survey/SegmentForm";
import { SurveyForm } from "./features/survey/SurveyForm";
import { RoutePlanner } from "./features/route/RoutePlanner";
import { ReviewInbox } from "./features/review/ReviewInbox";
import { RepairQueue } from "./features/repairs/RepairQueue";
import { RepeatComparison } from "./features/repairs/RepeatComparison";
type SurveyList = {
  items: Array<{
    id: string;
    label: string;
    status: string;
    capture_mode: string;
    demo_data: boolean;
  }>;
};

type ConnectionState = "checking" | "connected" | "unavailable";

export default function App() {
  const [connection, setConnection] = useState<ConnectionState>("checking");
  const [surveyList, setSurveyList] = useState<SurveyList>({ items: [] });
  const [resetMessage, setResetMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadWorkspace() {
      try {
        const [metaResponse, surveysResponse] = await Promise.all([
          fetch("/api/v1/meta"),
          fetch("/api/v1/surveys"),
        ]);

        if (!metaResponse.ok || !surveysResponse.ok) {
          throw new Error("The local API returned an error.");
        }

        const meta: {
          data_status: string;
          field_data_status: string;
          field_capture_enabled: boolean;
        } = await metaResponse.json();
        const surveys: SurveyList = await surveysResponse.json();

        if (active) {
          setSurveyList(surveys);
          setConnection(
            meta.data_status === "demo_fixture_only" &&
              meta.field_data_status === "not_collected" &&
              meta.field_capture_enabled === false
              ? "connected"
              : "unavailable",
          );
        }
      } catch {
        if (active) setConnection("unavailable");
      }
    }

    void loadWorkspace();
    return () => {
      active = false;
    };
  }, []);

  async function resetDemoFixture() {
    setResetMessage("");
    try {
      const resetResponse = await fetch("/api/v1/demo/reset", {
        method: "POST",
      });
      if (!resetResponse.ok) throw new Error("The demo reset failed.");

      setResetMessage("Demo marker reset. No field records were changed.");

      const [metaResponse, surveysResponse] = await Promise.all([
        fetch("/api/v1/meta"),
        fetch("/api/v1/surveys"),
      ]);

      if (!metaResponse.ok || !surveysResponse.ok) {
        setConnection("unavailable");
        setResetMessage(
          "Reset completed, but the API status or marker list could not be verified. Reload the page to inspect it.",
        );
        return;
      }

      const meta: {
        data_status: string;
        field_data_status: string;
        field_capture_enabled: boolean;
      } = await metaResponse.json();

      const surveys: SurveyList = await surveysResponse.json();
      setSurveyList(surveys);

      const safetyVerified =
        meta.data_status === "demo_fixture_only" &&
        meta.field_data_status === "not_collected" &&
        meta.field_capture_enabled === false;

      setConnection(safetyVerified ? "connected" : "unavailable");

      if (!safetyVerified) {
        setResetMessage(
          "Reset completed, but the API safety status could not be verified.",
        );
      }
    } catch {
      setConnection("unavailable");
      setResetMessage("Could not confirm the reset. Reload the page before retrying.");
    }
  }

  async function refreshSurveys() {
    const response = await fetch("/api/v1/surveys");
    if (!response.ok) throw new Error("Survey list unavailable.");
    setSurveyList(await response.json());
  }

  const connectionText = {
    checking: "Checking local service",
    connected: "Local service connected",
    unavailable: "Local service unavailable",
  }[connection];

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#overview" aria-label="VishraamPath home">
          <span className="wordmark-mark" aria-hidden="true" />
          <span>VishraamPath</span>
        </a>
        <nav className="topnav" aria-label="Primary navigation">
          <a href="#overview">Overview</a>
          <a href="#hour-one">Hour one</a>
        </nav>
        <span className="build-label">LOCAL PROTOTYPE</span>
      </header>

      <main id="overview" className="page">
        <div className="page-kicker">
          <span>TEAM ZENITH</span>
          <span className="kicker-rule" aria-hidden="true" />
          <span>NAGPUR / LOCAL DEMONSTRATOR</span>
        </div>

        <section className="intro" aria-labelledby="page-title">
          <div className="intro-copy">
            <p className="eyebrow">HOUR 01 / FOUNDATION</p>
            <h1 id="page-title">
              Nagpur footpath evidence, linked to gentler routes and repairs.
            </h1>
            <p className="lede">
              VishraamPath is planned to turn volunteer surveys into reviewed
              segment records. The same evidence will support route guidance
              and a municipal repair queue.
            </p>
          </div>
          <aside className="status-panel" aria-label="Prototype status">
            <span className="status-marker" aria-hidden="true" />
            <div>
              <p className="status-title">Foundation build</p>
              <p className="status-detail">
                The corridor card below is a structural fixture only. No field survey or route result exists.
              </p>
            </div>
          </aside>
        </section>

        <section className="workspace" aria-labelledby="workspace-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PROJECT WORKSPACE</p>
              <h2 id="workspace-title">Demo corridor foundation.</h2>
            </div>
            <span className="section-index">HOUR 1</span>
          </div>

          <div className="workspace-grid">
            <article className="record-panel">
              <div className="panel-topline">
                <span>LOCAL SURVEY FIXTURE</span>
                <div className="panel-actions">
                  <span
                    className="connection-state"
                    data-state={connection}
                    role="status"
                    aria-live="polite"
                  >
                    <span className="state-dot" aria-hidden="true" />
                    {connectionText}
                  </span>
                  <button
                    className="reset-control"
                    type="button"
                    onClick={resetDemoFixture}
                    disabled={connection !== "connected"}
                  >
                    Reset demo marker
                  </button>
                </div>
              </div>

              {surveyList.items.length === 0 ? (
                <div className="empty-state" aria-live="polite">
                  <div className="empty-mark" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <h3>Demo corridor marker is not loaded</h3>
                  <p>
                    Check that the local API is running. No field data or
                    replacement sample records are being shown.
                  </p>
                </div>
              ) : (
                <div className="fixture-list" aria-live="polite">
                  {surveyList.items.map((survey) => (
                    <article className="record-notice" key={survey.id}>
                      <p className="fixture-flag">
                        {survey.demo_data ? "DEMO DATA / STRUCTURAL FIXTURE" : "FIELD DATA"}
                      </p>
                      <h3>{survey.label}</h3>
                      <p>
                        Placeholder record only. No coordinates, field measurements,
                        images, defect observations, or route results are attached.
                        Permission status: unknown.
                      </p>
                    </article>
                  ))}
                </div>
              )}
              {resetMessage && (
                <p className="reset-message" aria-live="polite">
                  {resetMessage}
                </p>
              )}
            </article>

            <aside id="hour-one" className="next-panel">
              <p className="eyebrow">THIS HOUR</p>
              <h3>Label sample records before building the workflow.</h3>
              <p>
                Hour 1 establishes a local survey contract and resettable demo
                marker. Later work adds verified fixture evidence or permitted
                field data.
              </p>
              <div className="next-rule" />
              <p className="next-note">
                AI suggestions, scoring, maps, routing, and repair prioritisation
                are not active in this build.
              </p>
            </aside>
          </div>

          <SurveyForm onCreated={() => void refreshSurveys()} />
          <SegmentForm />
          <ReviewInbox />
        </section>
        <RoutePlanner />
        <RepairQueue />
        <RepeatComparison />

        <section className="sequence" aria-labelledby="sequence-title">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">PLANNED PRODUCT FLOW</p>
              <h2 id="sequence-title">One evidence trail. Two future outputs.</h2>
            </div>
          </div>
          <ol className="flow-list">
            <li>
              <span className="flow-number">01</span>
              <span className="flow-label">Volunteer survey</span>
              <span className="flow-state">PLANNED</span>
            </li>
            <li>
              <span className="flow-number">02</span>
              <span className="flow-label">Human confirmation</span>
              <span className="flow-state">PLANNED</span>
            </li>
            <li>
              <span className="flow-number">03</span>
              <span className="flow-label">Route guidance and Fix-First queue</span>
              <span className="flow-state">PLANNED</span>
            </li>
          </ol>
        </section>

        <footer className="page-footer">
          <span>VISHRAAMPATH / PROTOTYPE FOUNDATION</span>
          <span>Decision support, not accessibility certification.</span>
        </footer>
      </main>
    </div>
  );
}
