import { useState } from "react";
import type { FormEvent } from "react";

type Props = { onCreated: () => void };

export function SurveyForm({ onCreated }: Props) {
  const [label, setLabel] = useState("Nagpur Market Footpath 01");
  const [reviewer, setReviewer] = useState("Asha Volunteer");
  const [message, setMessage] = useState("Demo values are ready. Save the record to start the workflow.");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/v1/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          surveyed_by: reviewer,
          permission_status: "unknown",
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail ?? "Survey could not be saved.");
      setLabel("");
      setMessage("Demo survey saved. Permission is still unknown.");
      onCreated();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Survey could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="survey-form" onSubmit={submit}>
      <h2>Create a demo survey record</h2>
      <p>DEMO DATA. This form does not authorise field capture or upload media.</p>
      <label>Survey label<input required minLength={3} maxLength={120} value={label} onChange={(e) => setLabel(e.target.value)} /></label>
      <label>Volunteer name or team role<input required minLength={2} maxLength={80} value={reviewer} onChange={(e) => setReviewer(e.target.value)} /></label>
      <button type="submit" disabled={saving}>{saving ? "Saving" : "Save demo survey"}</button>
      <p aria-live="polite">{message}</p>
    </form>
  );
}