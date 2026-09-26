import { useEffect, useState } from "react";

type Item = {
  id: string;
  segment_id: string;
  class_code: string;
  description: string;
  source: string;
  confidence: number | null;
  latest_decision: string | null;
  demo_data: number;
};

type ScreeningResult = {
  label: string;
  explanation: string;
  rule_pack_version: string;
  unknown_dimensions: string[];
};

type Survey = { id: string; label: string; demo_data?: boolean };

export function ReviewInbox() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [message, setMessage] = useState("Loading demo surveys…");
  const [profile, setProfile] = useState("walking_stick");
  const [screeningResult, setScreeningResult] = useState<ScreeningResult | null>(null);
  const [surveyId, setSurveyId] = useState<string | null>(null);
  const [surveyLabel, setSurveyLabel] = useState("");

  async function load(nextProfile = profile, requestedSurveyId = surveyId ?? undefined) {
    setMessage("Loading the selected survey…");
    const surveysResponse = await fetch("/api/v1/surveys");
    if (!surveysResponse.ok) throw new Error("Review service is unavailable.");
    const surveysResult = await surveysResponse.json() as { items?: Survey[] };
    const availableSurveys = surveysResult.items ?? [];
    setSurveys(availableSurveys);
    const selectedSurvey = availableSurveys.find((survey) => survey.id === requestedSurveyId)
      ?? availableSurveys.find((survey) => survey.demo_data)
      ?? availableSurveys[0]
      ?? null;

    if (!selectedSurvey) {
      setSurveyId(null);
      setSurveyLabel("");
      setItems([]);
      setScreeningResult(null);
      setMessage("No survey records exist yet. Create a demo survey in Survey to begin.");
      return;
    }

    const nextSurveyId = selectedSurvey.id;
    setSurveyId(nextSurveyId);
    setSurveyLabel(selectedSurvey.label);

    const segmentsResponse = await fetch(`/api/v1/surveys/${nextSurveyId}/segments`);
    if (!segmentsResponse.ok) throw new Error("Review service is unavailable.");
    const segmentsResult = await segmentsResponse.json() as { items?: Array<{ id: string }> };
    const selectedSegment = segmentsResult.items?.[0] ?? null;

    const response = await fetch(`/api/v1/surveys/${nextSurveyId}/suggestions`);
    if (!response.ok) throw new Error("Review service is unavailable.");
    const result = await response.json();
    if (selectedSegment) {
      const scoreResponse = await fetch(`/api/v1/segments/${selectedSegment.id}/screening?profile_id=${nextProfile}`);
      if (!scoreResponse.ok) throw new Error("Screening status is unavailable.");
      setScreeningResult(await scoreResponse.json());
    } else {
      setScreeningResult(null);
    }
    setItems(result.items);
    setMessage(result.items.length
      ? ""
      : selectedSegment
        ? "This survey has a segment but no suggestion attached. Saving a survey or segment does not generate an AI observation."
        : "This survey has no segment yet. Add one in Survey. Saving a segment does not generate an AI observation.");
  }

  useEffect(() => { void load().catch(() => setMessage("Review service unavailable.")); }, []);

  async function decide(id: string, decision: string) {
    const body = decision === "confirmed"
      ? { decision, severity: "medium", note: "Demo reviewer decision" }
      : { decision, note: "Demo reviewer decision" };
    const response = await fetch(`/api/v1/suggestions/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      setMessage("Could not save the review. No score was updated.");
      return;
    }
    await load();
  }

  return (
    <section aria-labelledby="review-title">
      <p className="eyebrow">DEMO DATA / HUMAN DECISION REQUIRED</p>
      <h2 id="review-title">Suggestion review</h2>
      {message && <p aria-live="polite">{message}</p>}
      {surveys.length > 0 && <label>Survey record
        <select value={surveyId ?? ""} onChange={(event) => {
          void load(profile, event.target.value).catch(() => setMessage("Review service unavailable."));
        }}>
          {surveys.map((survey) => <option key={survey.id} value={survey.id}>{survey.label}</option>)}
        </select>
      </label>}
      {surveyId && <p>Selected record: <strong>{surveyLabel}</strong></p>}
      <label>Screening profile
        <select value={profile} onChange={(event) => {
          const value = event.target.value;
          setProfile(value);
          void load(value).catch(() => setMessage("Screening result unavailable."));
        }}>
          <option value="walking_stick">Walking-stick use</option>
          <option value="wheelchair">Wheelchair use</option>
        </select>
      </label>
      {screeningResult && <aside className="review-card" aria-live="polite">
        <h3>{screeningResult.label}: no numeric score</h3>
        <p>{screeningResult.explanation}</p>
        <p>Rule pack: {screeningResult.rule_pack_version}. Unknown: {screeningResult.unknown_dimensions.join(", ")}.</p>
      </aside>}
      {items.map((item) => (
        <article className="review-card" key={item.id}>
          <p>{item.class_code.replaceAll("_", " ")} · {item.segment_id}</p>
          <div className="evidence-placeholder">ILLUSTRATIVE EVIDENCE RECORD<br /><span>No photo or video is attached in this prototype.</span></div>
          <p>{item.description}</p>
          <p>Source: {item.source}. Confidence is not proof.</p>
          <p>Current decision: {item.latest_decision ?? "Not reviewed"}</p>
          <div className="review-actions">
            <button type="button" onClick={() => void decide(item.id, "confirmed")}>Confirm, medium severity</button>
            <button type="button" onClick={() => void decide(item.id, "rejected")}>Reject</button>
            <button type="button" onClick={() => void decide(item.id, "uncertain")}>Uncertain</button>
          </div>
        </article>
      ))}
    </section>
  );
}
