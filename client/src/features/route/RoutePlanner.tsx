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

const profileLabels: Record<string, string> = {
  walking_stick: "Walking with a stick",
  wheelchair: "Using a wheelchair",
};

const languageLabels: Record<string, string> = {
  mr: "मराठी (Marathi)",
  hi: "हिंदी (Hindi)",
};

export function RoutePlanner() {
  const [origin, setOrigin] = useState("My home");
  const [destination, setDestination] = useState("Market square");
  const [profile, setProfile] = useState("walking_stick");
  const [language, setLanguage] = useState("mr");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [message, setMessage] = useState("");
  const [speechMessage, setSpeechMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanOrigin = origin.trim();
    const cleanDestination = destination.trim();
    if (!cleanOrigin || !cleanDestination) {
      setMessage("Please enter both your starting point and destination.");
      return;
    }
    setMessage("");
    setSpeechMessage("");
    setPlan(null);
    setLoading(true);
    try {
      // The API uses the existing fixture IDs. The typed names are shown back to
      // the user so the flow behaves like a real request without claiming live routing.
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
      const result = await response.json() as Plan & { detail?: string };
      if (!response.ok) throw new Error(result.detail ?? "This sample route is unavailable.");
      setPlan(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "This sample route is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  function replayInstructions() {
    if (!plan) return;
    if (!("speechSynthesis" in window)) {
      setSpeechMessage("Spoken instructions are not available on this device. The written steps below are the fallback.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(plan.instructions.join(". "));
    utterance.lang = language === "mr" ? "mr-IN" : "hi-IN";
    utterance.onerror = () => setSpeechMessage("Speech could not be played. Please use the written steps below.");
    utterance.onend = () => setSpeechMessage("Finished. Select the button again to replay the steps.");
    setSpeechMessage("Playing the written sample steps. This is not live navigation.");
    window.speechSynthesis.speak(utterance);
  }

  return (
    <section aria-labelledby="route-title">
      <p className="eyebrow">STEP 1 OF 2 · PLAN A WALK</p>
      <h2 id="route-title">Where would you like to go?</h2>
      <p className="route-helper">Type the two places in simple words. Location access is not needed for this prototype.</p>
      <form className="route-form route-form--senior" onSubmit={submit}>
        <label htmlFor="route-origin">Starting point
          <input id="route-origin" value={origin} onChange={(event) => setOrigin(event.target.value)} placeholder="For example: my home" autoComplete="street-address" />
        </label>
        <label htmlFor="route-destination">Destination
          <input id="route-destination" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="For example: the market" />
        </label>
        <label htmlFor="route-profile">I am walking with
          <select id="route-profile" value={profile} onChange={(event) => setProfile(event.target.value)}>
            <option value="walking_stick">A walking stick</option>
            <option value="wheelchair">A wheelchair</option>
          </select>
        </label>
        <label htmlFor="route-language">Show guidance in
          <select id="route-language" value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value="mr">मराठी (Marathi)</option>
            <option value="hi">हिंदी (Hindi)</option>
          </select>
        </label>
        <button className="route-primary-action" type="submit" disabled={loading}>{loading ? "Preparing the sample…" : "Show route options"}</button>
      </form>
      {message && <p className="form-message form-message--error" role="alert">{message}</p>}
      {plan && <div className="route-result" aria-live="polite">
        <div className="route-result-heading">
          <span className="route-fixture-tag">SAMPLE ONLY</span>
          <strong>One route option is ready</strong>
        </div>
        <p className="route-profile-line">For <strong>{origin}</strong> to <strong>{destination}</strong> · {profileLabels[plan.profile_id]} · {languageLabels[plan.language]}</p>
        <div className="route-option-card">
          <div><span className="route-option-label">ROUTE STATUS</span><strong>Not assessed</strong></div>
          <div><span className="route-option-label">WHAT THIS SHOWS</span><strong>A gentler-route decision, with limits</strong></div>
        </div>
        <div className="route-sequence" aria-label="Sample route sequence with no real locations">
          <div className="route-sequence-stop"><span>START</span><strong>{origin}</strong></div>
          <div className="route-sequence-connector" aria-hidden="true" />
          <div className="route-sequence-segment"><span>SEGMENT EVIDENCE</span><strong>{plan.segments.join(", ")}</strong><em>Not assessed</em></div>
          <div className="route-sequence-connector" aria-hidden="true" />
          <div className="route-sequence-stop"><span>END</span><strong>{destination}</strong></div>
        </div>
        <p className="route-sequence-note">This prototype has no live map, distance, travel time, street coordinates, or turn-by-turn navigation. The names you entered are retained only to explain the flow.</p>
        <div className="route-result-columns">
          <div>
            <h3>What we do not know yet</h3>
            <ul>{plan.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
          </div>
          <div>
            <h3>Step 2 · Read or hear the guidance</h3>
            <ol>{plan.instructions.map((line, index) => <li key={`${index}-${line}`} lang={language === "mr" ? "mr" : "hi"}>{line}</li>)}</ol>
          </div>
        </div>
        <button className="speech-button" type="button" onClick={replayInstructions}>Play these written steps</button>
        <p className="speech-status" aria-live="polite">{speechMessage}</p>
        <p className="route-limitations"><strong>Important:</strong> AI can suggest an observation, but a person must review it. “Not assessed” does not mean accessible or safe.</p>
      </div>}
    </section>
  );
}
