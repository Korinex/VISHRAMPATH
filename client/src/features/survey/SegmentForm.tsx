import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type Survey = { id: string; label: string; demo_data: boolean };
type Segment = { id: string; sequence_no: number; street_label: string; length_m: number | null; demo_data: boolean };

export function SegmentForm({ surveys }: { surveys: Survey[] }) {
  const [surveyId, setSurveyId] = useState(surveys[0]?.id ?? "");
  const [label, setLabel] = useState("Market Road Stretch A");
  const [sequence, setSequence] = useState("1");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [message, setMessage] = useState("Use the demo values below to create a sample corridor record.");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!surveys.some((survey) => survey.id === surveyId)) {
      setSurveyId(surveys[0]?.id ?? "");
    }
  }, [surveys, surveyId]);

  useEffect(() => {
    let active = true;
    async function loadSegments(id: string) {
      if (!id) { setSegments([]); return; }
      try {
        const response = await fetch(`/api/v1/surveys/${id}/segments`);
        if (!response.ok) throw new Error("Segment list unavailable.");
        const data = await response.json() as { items: Segment[] };
        if (active) {
          setSegments(data.items);
          setMessage(data.items.length ? "Demo segments are records only; measured length and GPS are unknown." : "No segment record yet. Add a demo segment below.");
        }
      } catch {
        if (active) setMessage("Segment service unavailable.");
      }
    }
    void loadSegments(surveyId);
    return () => { active = false; };
  }, [surveyId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!surveyId) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/v1/surveys/${surveyId}/segments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sequence_no: Number(sequence), street_label: label }),
      });
      const data = await response.json() as { detail?: string; items?: Segment[] };
      if (!response.ok) throw new Error(data.detail ?? "Segment was not saved.");
      const refreshed = await fetch(`/api/v1/surveys/${surveyId}/segments`);
      if (!refreshed.ok) throw new Error("Segment saved, but the list could not be refreshed.");
      const refreshedData = await refreshed.json() as { items: Segment[] };
      setSegments(refreshedData.items);
      setLabel("");
      setMessage("Demo segment saved. No measured length, GPS, or street observation is attached.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Segment was not saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="survey-form" aria-labelledby="segment-form-title">
      <p className="eyebrow">SEGMENT RECORD</p>
      <h2 id="segment-form-title">Add a demo segment</h2>
      <p>Approximately 50 m is the proposed unit for field records. This demo entry does not claim a measured segment length.</p>
      <form onSubmit={submit}>
        <label>Demo survey<select required value={surveyId} onChange={(event) => setSurveyId(event.target.value)}>
          <option value="">Choose demo survey</option>{surveys.map((survey) => <option key={survey.id} value={survey.id}>{survey.label}</option>)}
        </select></label>
        <label>Sequence number<input type="number" min="1" max="9999" required value={sequence} onChange={(event) => setSequence(event.target.value)} /></label>
        <label>Segment label<input required minLength={2} maxLength={120} value={label} onChange={(event) => setLabel(event.target.value)} /></label>
        <button type="submit" disabled={!surveyId || saving}>{saving ? "Saving…" : "Save demo segment"}</button>
      </form>
      {segments.length > 0 && <ul>{segments.map((segment) => <li key={segment.id}>{segment.street_label} · length {segment.length_m ?? "unknown"} · DEMO DATA</li>)}</ul>}
      <p role="status" aria-live="polite">{message}</p>
    </section>
  );
}
