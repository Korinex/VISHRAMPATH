import { useEffect, useState } from "react";

type Repair = {
  id: string;
  segment_id: string;
  issue_code: string;
  severity: string;
  suggested_action: string;
  priority_rank: number;
  priority_method: string;
  indicative_cost_amount: number | null;
  uncertainty_note: string;
  status: string;
  demo_data: number;
  evidence_description: string;
};

type Candidate = {
  id: string;
  segment_id: string;
  class_code: string;
  description: string;
  severity: string;
  demo_data: number;
};

export function RepairQueue() {
  const [items, setItems] = useState<Repair[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [actions, setActions] = useState<Record<string, string>>({});
  const [interventions, setInterventions] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("Loading advisory queue");

  async function load() {
    const [queueResponse, candidateResponse] = await Promise.all([
      fetch("/api/v1/repair-queue"),
      fetch("/api/v1/confirmed-observations"),
    ]);
    if (!queueResponse.ok || !candidateResponse.ok) throw new Error("Queue unavailable.");
    const queue = await queueResponse.json();
    const candidatesResult = await candidateResponse.json();
    setItems(queue.items);
    setCandidates(candidatesResult.items);
    setNotice(queue.notice);
  }

  useEffect(() => { void load().catch(() => setNotice("Repair queue unavailable.")); }, []);

  async function addToQueue(candidate: Candidate) {
    const action = actions[candidate.id]?.trim();
    if (!action) { setNotice("Enter an illustrative action before adding this item."); return; }
    const response = await fetch("/api/v1/repair-items", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ observation_id: candidate.id, suggested_action: action }),
    });
    if (!response.ok) { setNotice("Item not added. Check that the current decision is confirmed."); return; }
    setNotice("Illustrative demo item added for review.");
    await load();
  }

  async function recordIntervention(item: Repair) {
    const description = interventions[item.id]?.trim();
    if (!description) { setNotice("Enter a demo intervention note first."); return; }
    const response = await fetch(`/api/v1/repair-items/${item.id}/interventions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, recorded_by: "Team demo reviewer" }),
    });
    if (!response.ok) { setNotice("Intervention note could not be saved."); return; }
    setNotice("Demo action recorded. This is not a verified repair.");
    await load();
  }

  return (
    <section aria-labelledby="repair-title">
      <p className="eyebrow">STEP 3 · PLAN THE NEXT ACTION</p>
      <h2 id="repair-title">Choose what to fix first</h2>
      <p>{notice}</p>
      <a href="/api/v1/repair-queue.csv">Download CSV</a>
      <h3>Findings ready for planning</h3>
      {candidates.map((candidate) => (
        <article className="repair-row" key={candidate.id}>
          <p className="repair-row-title">SAMPLE FINDING · {candidate.class_code.replaceAll("_", " ")}</p>
          <p>Path section: {candidate.segment_id}</p>
          <p>{candidate.description}</p>
          <label>What could the team check or do next?
            <input value={actions[candidate.id] ?? ""} onChange={(event) => setActions({ ...actions, [candidate.id]: event.target.value })} />
          </label>
          <button type="button" onClick={() => void addToQueue(candidate)}>Add to planning list</button>
        </article>
      ))}
      {items.length === 0 && <p>No human-confirmed repair items are in the queue.</p>}
      {items.map((item) => (
        <article className="repair-row" key={item.id}>
          <p className="repair-row-title">Planning order {item.priority_rank} · {item.issue_code.replaceAll("_", " ")}</p>
          <p>{item.evidence_description}</p>
          <p><strong>Suggested next step:</strong> {item.suggested_action}</p>
          <p>{item.uncertainty_note}</p>
          <p><strong>Cost:</strong> {item.indicative_cost_amount ?? "Not entered yet"}. No source-backed cost is available.</p>
          <p><strong>Status:</strong> Waiting for team review. This is not a completed or verified repair.</p>
          {item.status === "for_review" && <>
            <label>Write down what the team did (sample only)
              <input value={interventions[item.id] ?? ""} onChange={(event) => setInterventions({ ...interventions, [item.id]: event.target.value })} />
            </label>
            <button type="button" onClick={() => void recordIntervention(item)}>Save this sample action</button>
          </>}
        </article>
      ))}
    </section>
  );
}
