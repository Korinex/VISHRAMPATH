import { useEffect, useState } from "react";

type Survey = { id: string; label: string; demo_data: boolean };
type Segment = { id: string; sequence_no: number; street_label: string; demo_data: boolean };

export function RepeatComparison() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [baselineSurvey, setBaselineSurvey] = useState("");
  const [repeatSurvey, setRepeatSurvey] = useState("");
  const [baselineSegments, setBaselineSegments] = useState<Segment[]>([]);
  const [repeatSegments, setRepeatSegments] = useState<Segment[]>([]);
  const [baselineSegment, setBaselineSegment] = useState("");
  const [repeatSegment, setRepeatSegment] = useState("");
  const [result, setResult] = useState("");

  useEffect(() => {
    fetch("/api/v1/surveys").then((response) => response.json())
      .then((data) => setSurveys(data.items.filter((item: Survey) => item.demo_data)))
      .catch(() => setResult("Survey list unavailable."));
  }, []);

  async function loadSegments(surveyId: string, setRows: (rows: Segment[]) => void) {
    if (!surveyId) { setRows([]); return; }
    const response = await fetch(`/api/v1/surveys/${surveyId}/segments`);
    if (!response.ok) { setResult("Segment list unavailable."); return; }
    const data = await response.json();
    setRows(data.items);
  }

  async function submit() {
    if (!repeatSurvey || !baselineSegment) { setResult("Choose a repeat survey and baseline segment."); return; }
    const response = await fetch(`/api/v1/surveys/${repeatSurvey}/repeat-links`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseline_segment_id: baselineSegment,
        repeat_segment_id: repeatSegment || null,
        alignment_status: "uncertain",
        comparison_note: "DEMO DATA. Repeatability workflow example only; no real change was observed.",
      }),
    });
    const data = await response.json();
    setResult(response.ok
      ? `DEMO DATA. Link created. Alignment: ${data.alignment_status}. Not a verified repair.`
      : data.detail ?? "Comparison link could not be created.");
  }

  return <section aria-labelledby="repeat-title">
    <p className="eyebrow">DEMO DATA / REPEAT COMPARISON</p>
    <h2 id="repeat-title">Link a later survey</h2>
    <label>Baseline survey<select value={baselineSurvey} onChange={(event) => { setBaselineSurvey(event.target.value); void loadSegments(event.target.value, setBaselineSegments); }}>
      <option value="">Choose survey</option>{surveys.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
    </select></label>
    <label>Baseline segment<select value={baselineSegment} onChange={(event) => setBaselineSegment(event.target.value)}>
      <option value="">Choose segment</option>{baselineSegments.map((item) => <option key={item.id} value={item.id}>{item.street_label}</option>)}
    </select></label>
    <label>Repeat survey<select value={repeatSurvey} onChange={(event) => { setRepeatSurvey(event.target.value); void loadSegments(event.target.value, setRepeatSegments); }}>
      <option value="">Choose later survey</option>{surveys.filter((item) => item.id !== baselineSurvey).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
    </select></label>
    <label>Repeat segment<select value={repeatSegment} onChange={(event) => setRepeatSegment(event.target.value)}>
      <option value="">No aligned segment yet</option>{repeatSegments.map((item) => <option key={item.id} value={item.id}>{item.street_label}</option>)}
    </select></label>
    <button type="button" onClick={() => void submit()}>Save demo comparison</button>
    <p aria-live="polite">{result}</p>
  </section>;
}
