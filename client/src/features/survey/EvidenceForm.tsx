import { useEffect, useState } from "react";

type Survey = { id: string; label: string; demo_data: boolean };
type Segment = { id: string; street_label: string; demo_data: boolean };
type Props = { surveys: Survey[]; onCreated?: (surveyId: string) => void };

export function EvidenceForm({ surveys, onCreated }: Props) {
  const [surveyId, setSurveyId] = useState(surveys[0]?.id ?? "");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [segmentId, setSegmentId] = useState("");
  const [description, setDescription] = useState("There is a sample obstruction on the walking path.");
  const [message, setMessage] = useState("Add a short sample note. It will appear in Check information for a human decision.");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!surveys.some((survey) => survey.id === surveyId)) setSurveyId(surveys[0]?.id ?? "");
  }, [surveys, surveyId]);

  useEffect(() => {
    let active = true;
    if (!surveyId) { setSegments([]); setSegmentId(""); return undefined; }
    fetch(`/api/v1/surveys/${surveyId}/segments`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Path sections are unavailable.");
        return response.json() as Promise<{ items: Segment[] }>;
      })
      .then((data) => {
        if (!active) return;
        setSegments(data.items);
        setSegmentId((current) => data.items.some((item) => item.id === current) ? current : data.items[0]?.id ?? "");
      })
      .catch((error: unknown) => { if (active) setMessage(error instanceof Error ? error.message : "Path sections are unavailable."); });
    return () => { active = false; };
  }, [surveyId]);

  async function submit() {
    if (!surveyId || !segmentId || description.trim().length < 3) {
      setMessage("Choose a path section and write at least a few words.");
      return;
    }
    setSaving(true);
    setMessage("Saving the sample note…");
    try {
      const response = await fetch(`/api/v1/surveys/${surveyId}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segment_id: segmentId, description: description.trim() }),
      });
      const data = await response.json() as { detail?: string; review_status?: string };
      if (!response.ok) throw new Error(data.detail ?? "The sample note could not be saved.");
      setMessage("Saved. The note is now waiting for a person to check it in Check information.");
      setDescription("");
      onCreated?.(surveyId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The sample note could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="survey-form evidence-form" aria-labelledby="evidence-form-title">
      <p className="eyebrow">CONNECT SURVEY TO REVIEW</p>
      <h2 id="evidence-form-title">Add a sample path note</h2>
      <p>This is the bridge from a survey to a human check. It creates sample information only; it does not upload a photo or prove a street condition.</p>
      <label>Which survey?<select value={surveyId} onChange={(event) => setSurveyId(event.target.value)}><option value="">Choose a survey</option>{surveys.map((survey) => <option key={survey.id} value={survey.id}>{survey.label}</option>)}</select></label>
      <label>Which part of the path?<select value={segmentId} onChange={(event) => setSegmentId(event.target.value)}><option value="">Choose a path section</option>{segments.map((segment) => <option key={segment.id} value={segment.id}>{segment.street_label}</option>)}</select></label>
      <label>What did the volunteer notice?<textarea rows={3} minLength={3} maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="For example: uneven surface near the crossing" /></label>
      <button type="button" onClick={() => void submit()} disabled={saving || !surveyId || !segmentId}>{saving ? "Saving…" : "Save note for human checking"}</button>
      <p role="status" aria-live="polite">{message}</p>
    </section>
  );
}
