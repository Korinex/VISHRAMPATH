import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type Survey = { id: string; label: string; demo_data: boolean };
type Segment = { id: string; sequence_no: number; street_label: string; length_m: number | null; demo_data: boolean };

export function SegmentForm() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [surveyId, setSurveyId] = useState("");
  const [label, setLabel] = useState("");
  const [sequence, setSequence] = useState("1");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [message, setMessage] = useState("Loading demo surveys");

  async function loadSurveys() {
    const response = await fetch("/api/v1/surveys");
    if (!response.ok) throw new Error("Survey list unavailable.");
    const data = await response.json();
    const demoSurveys: Survey[] = data.items.filter((item: Survey) => item.demo_data);
    setSurveys(demoSurveys);
    if (!surveyId && demoSurveys[0]) setSurveyId(demoSurveys[0].id);
  }

  async function loadSegments(id: string) {
    if (!id) { setSegments([]); return; }
    const response = await fetch(`/api/v1/surveys/${id}/segments`);
    if (!response.ok) throw new Error("Segment list unavailable.");
    const data = await response.json();
    setSegments(data.items);
  }

  useEffect(() => {
    void loadSurveys().catch(() => setMessage("Survey service unavailable."));
  }, []);
  useEffect(() => {
    void loadSegments(surveyId).catch(() => setMessage("Segment list unavailable."));
  }, [surveyId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`/api/v1/surveys/${surveyId}/segments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sequence_no: Number(sequence), street_label: label }),
    });
    const data = await response.json();
    if (!response.ok) { setMessage(data.detail ?? "Segment was not saved."); return; }
    setLabel("");
    setMessage("Demo segment saved. Length and GPS accuracy are unknown.");
    await loadSegments(surveyId);
  }

  return <section className="survey-form" aria-labelledby="segment-form-title">
    <h2 id="segment-form-title">Add a demo segment</h2>
    <p>DEMO DATA only. This form does not record a measured length, location, or field observation.</p>
    <form onSubmit={submit}>
      <label>Demo survey<select required value={surveyId} onChange={(event) => setSurveyId(event.target.value)}>
        <option value="">Choose demo survey</option>{surveys.map((survey) => <option key={survey.id} value={survey.id}>{survey.label}</option>)}
      </select></label>
      <label>Sequence number<input type="number" min="1" max="9999" required value={sequence} onChange={(event) => setSequence(event.target.value)} /></label>
      <label>Segment label<input required minLength={2} maxLength={120} value={label} onChange={(event) => setLabel(event.target.value)} /></label>
      <button type="submit" disabled={!surveyId}>Save demo segment</button>
    </form>
    <ul>{segments.map((segment) => <li key={segment.id}>{segment.street_label}, length {segment.length_m ?? "unknown"}, DEMO DATA</li>)}</ul>
    <p aria-live="polite">{message}</p>
  </section>;
}