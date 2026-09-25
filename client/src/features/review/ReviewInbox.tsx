import { useEffect, useState } from "react";

type Item = {
  id: string;
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

export function ReviewInbox() {
  const [items, setItems] = useState<Item[]>([]);
  const [message, setMessage] = useState("Loading demo suggestions");
  const [profile, setProfile] = useState("walking_stick");
  const [screeningResult, setScreeningResult] = useState<ScreeningResult | null>(null);

  async function load(nextProfile = profile) {
    const [response, scoreResponse] = await Promise.all([
      fetch("/api/v1/surveys/hour-1-demo-corridor/suggestions"),
      fetch(`/api/v1/segments/demo-segment-01/screening?profile_id=${nextProfile}`),
    ]);
    if (!response.ok || !scoreResponse.ok) throw new Error("Review service is unavailable.");
    const result = await response.json();
    setScreeningResult(await scoreResponse.json());
    setItems(result.items);
    setMessage(result.items.length ? "" : "No suggestions available. No defect is being claimed.");
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
          <p>{item.class_code.replaceAll("_", " ")}</p>
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
