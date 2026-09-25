import { useState } from "react";
import type { FormEvent } from "react";

type Plan = {
  route_id: string;
  profile_id: string;
  language: string;
  route_source: string;
  segments: string[];
  warnings: string[];
  instructions: string[];
  demo_data: boolean;
  limitations: string[];
};

export function RoutePlanner() {
  const [profile, setProfile] = useState("walking_stick");
  const [language, setLanguage] = useState("mr");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [message, setMessage] = useState("");
  const [speechMessage, setSpeechMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setPlan(null);
    try {
      const response = await fetch("/api/v1/routes/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin_id: "demo-origin",
          destination_id: "demo-market",
          profile_id: profile,
          language,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail ?? "Route example unavailable.");
      setPlan(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Route example unavailable.");
    }
  }

  function replayInstructions() {
    if (!plan) return;
    if (!("speechSynthesis" in window)) {
      setSpeechMessage("Speech is unavailable on this device. Use the visible text instructions.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(plan.instructions.join(". "));
    utterance.lang = language === "mr" ? "mr-IN" : "hi-IN";
    utterance.onerror = () => setSpeechMessage("Speech could not be played. Use the visible text instructions.");
    utterance.onend = () => setSpeechMessage("Instructions finished. Select replay to hear them again.");
    setSpeechMessage("Playing route text. Follow the screen if the voice is unclear.");
    window.speechSynthesis.speak(utterance);
  }

  return (
    <section aria-labelledby="route-title">
      <p className="eyebrow">DEMO DATA / NOT LIVE NAVIGATION</p>
      <h2 id="route-title">Explore a route example</h2>
      <form className="route-form" onSubmit={submit}>
        <label>Mobility profile
          <select value={profile} onChange={(event) => setProfile(event.target.value)}>
            <option value="walking_stick">Walking-stick use</option>
            <option value="wheelchair">Wheelchair use</option>
          </select>
        </label>
        <label>Language
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value="mr">Marathi</option>
            <option value="hi">Hindi</option>
          </select>
        </label>
        <button type="submit">Show sample route</button>
      </form>
      {message && <p role="status">{message}</p>}
      {plan && <div className="route-result" aria-live="polite">
        <p><strong>DEMO DATA.</strong> {plan.route_source}</p>
        <p>Profile: {plan.profile_id.replaceAll("_", " ")}. Segment IDs: {plan.segments.join(", ")}.</p>
        <h3>Warnings</h3>
        <ul>{plan.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
        <h3>Instructions</h3>
        <ol>{plan.instructions.map((line) => <li key={line}>{line}</li>)}</ol>
        <button type="button" onClick={replayInstructions}>Replay spoken instructions</button>
        <p aria-live="polite">{speechMessage}</p>
        <p>{plan.limitations.join(" ")}</p>
      </div>}
    </section>
  );
}
