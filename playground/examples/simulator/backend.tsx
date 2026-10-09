import { useState } from "react";
import {
  Input,
  Label,
  SequenceEditor,
  SimulationPanel,
  useSimulationPlayback,
  type SimulationTrace,
  type TraceTone,
} from "leastui";
import { rules, type Rule } from "../sequence-editor/rules";

// ---------------------------------------------------------------------------
// Pretend this is your API: POST /risk/rule-groups/:id/dry-run. The real engine
// decides; the UI only draws what it returns.

type DryRunResponse = {
  decision: "ALLOW" | "REVIEW" | "BLOCK";
  decidedBy: string | null;
  evaluations: { ruleKey: string; matched: boolean; action: Rule["action"]; reason: string }[];
};

async function dryRun(sequence: string[], tx: { payee: string; amount: number }): Promise<DryRunResponse> {
  await new Promise((r) => setTimeout(r, 600));
  const evaluations: DryRunResponse["evaluations"] = [];
  let decision: DryRunResponse["decision"] = "ALLOW";
  let decidedBy: string | null = null;
  for (const key of sequence) {
    const rule = rules.find((r) => r.key === key)!;
    const matched =
      (key === "blocklist-vpa" && /scam|fraud/i.test(tx.payee)) ||
      (key === "amount-high" && tx.amount > 200_000) ||
      (key === "trusted-merchant" && tx.payee.endsWith("@verified"));
    evaluations.push({ ruleKey: key, matched, action: rule.action, reason: matched ? `${rule.name}` : "Did not match" });
    if (matched && (rule.action === "BLOCK" || rule.action === "ALLOW")) {
      decision = rule.action;
      decidedBy = key;
      break;
    }
    if (matched && rule.action === "REVIEW") {
      decision = "REVIEW";
      decidedBy = key;
    }
  }
  return { decision, decidedBy, evaluations };
}

// ---------------------------------------------------------------------------
// The only glue you write: map the response to a trace.

const actionTone: Record<Rule["action"], TraceTone> = { BLOCK: "danger", REVIEW: "warning", WARN: "warning", ALLOW: "success" };
const decisionLabel = { ALLOW: "Approved", REVIEW: "Sent to review", BLOCK: "Blocked" } as const;

function toTrace(res: DryRunResponse): SimulationTrace {
  const decider = rules.find((r) => r.key === res.decidedBy);
  return {
    steps: res.evaluations.map((e) => ({
      nodeId: e.ruleKey,
      tone: e.matched ? actionTone[e.action] : "success",
      note: e.matched ? e.action[0] + e.action.slice(1).toLowerCase() : "Pass",
      detail: e.reason,
    })),
    outcome: {
      label: decisionLabel[res.decision],
      tone: res.decision === "ALLOW" ? "success" : res.decision === "BLOCK" ? "danger" : "warning",
      detail: decider ? `By "${decider.name}"` : "No rule stopped it",
    },
  };
}

const sequence = ["trusted-merchant", "blocklist-vpa", "velocity-1h", "amount-high", "new-device"];

export default function SimulatorBackend() {
  const [tx, setTx] = useState({ payee: "fraud.shop@okaxis", amount: 12_000 });
  const [response, setResponse] = useState<DryRunResponse | null>(null);
  const [running, setRunning] = useState(false);
  const trace = response ? toTrace(response) : null;
  const playback = useSimulationPlayback(trace);

  const run = async () => {
    setRunning(true);
    try {
      setResponse(await dryRun(sequence, tx));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <SequenceEditor<Rule>
        readOnly
        defaultView="flow"
        items={rules}
        getKey={(rule) => rule.key}
        getLabel={(rule) => rule.name}
        getDescription={(rule) => `${rule.category} · ${rule.action}`}
        value={sequence}
        simulation={trace ? { trace, step: playback.step } : undefined}
        labels={{ title: "Live rule group (read-only)" }}
      />
      <SimulationPanel
        title="Dry run against the API"
        trace={trace}
        playback={playback}
        getLabel={(key) => rules.find((r) => r.key === key)?.name ?? key}
        onRun={run}
        running={running}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="be-payee" className="text-xs">Payee VPA</Label>
            <Input id="be-payee" value={tx.payee} onChange={(e) => setTx({ ...tx, payee: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="be-amount" className="text-xs">Amount (₹)</Label>
            <Input id="be-amount" type="number" value={tx.amount} onChange={(e) => setTx({ ...tx, amount: Number(e.target.value) })} />
          </div>
        </div>
        {response && (
          <details className="text-sm">
            <summary className="text-muted-foreground cursor-pointer text-xs">API response</summary>
            <pre className="bg-muted mt-2 max-h-48 overflow-auto rounded-md p-2 text-[11px]">{JSON.stringify(response, null, 2)}</pre>
          </details>
        )}
      </SimulationPanel>
    </div>
  );
}
