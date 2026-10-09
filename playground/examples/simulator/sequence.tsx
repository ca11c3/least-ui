import { useState } from "react";
import {
  Checkbox,
  Input,
  Label,
  SequenceEditor,
  SimulationPanel,
  simulateSequence,
  useSimulationPlayback,
  type EvaluateResult,
  type SimulationTrace,
} from "leastui";
import { rules, type Rule } from "../sequence-editor/rules";

type Tx = { amount: number; payee: string; paymentsLastHour: number; newDevice: boolean; hour: number };

// In your app these checks live in the backend; send the transaction to a dry-run
// endpoint and map its trace instead. Local checks keep the demo self-contained.
const checks: Record<string, (tx: Tx) => { hit: boolean; why: string }> = {
  "velocity-1h": (tx) => ({ hit: tx.paymentsLastHour > 10, why: `${tx.paymentsLastHour} payments in the last hour` }),
  "amount-high": (tx) => ({ hit: tx.amount > 200_000, why: `Amount ₹${tx.amount.toLocaleString("en-IN")}` }),
  "new-device": (tx) => ({ hit: tx.newDevice, why: tx.newDevice ? "First payment from this device" : "Known device" }),
  "geo-mismatch": () => ({ hit: false, why: "Same state as home" }),
  "blocklist-vpa": (tx) => ({ hit: /scam|fraud/i.test(tx.payee), why: `Payee ${tx.payee}` }),
  "trusted-merchant": (tx) => ({ hit: tx.payee.endsWith("@verified"), why: `Payee ${tx.payee}` }),
  "night-time": (tx) => ({ hit: tx.hour >= 1 && tx.hour < 5, why: `Sent at ${tx.hour}:00` }),
};

// First BLOCK or ALLOW decides; REVIEW and WARN flag the payment and carry on.
function evaluate(rule: Rule, tx: Tx): EvaluateResult {
  const { hit, why } = checks[rule.key]?.(tx) ?? { hit: false, why: "" };
  if (!hit) return { tone: "success", note: "Pass", detail: why };
  switch (rule.action) {
    case "BLOCK":
      return { tone: "danger", note: "Block", detail: why, stop: true, outcome: { label: "Blocked", tone: "danger", detail: `By "${rule.name}"` } };
    case "ALLOW":
      return { tone: "success", note: "Allow", detail: why, stop: true, outcome: { label: "Allowed", tone: "success", detail: `By "${rule.name}"` } };
    case "REVIEW":
      return { tone: "warning", note: "Review", detail: why, outcome: { label: "Sent to review", tone: "warning", detail: `Flagged by "${rule.name}"` } };
    default:
      return { tone: "warning", note: "Warn", detail: why };
  }
}

export default function SequenceEditorSimulate() {
  const [sequence, setSequence] = useState(["trusted-merchant", "blocklist-vpa", "velocity-1h", "amount-high", "new-device"]);
  const [tx, setTx] = useState<Tx>({ amount: 250_000, payee: "shop@okbank", paymentsLastHour: 3, newDevice: true, hour: 14 });
  const [trace, setTrace] = useState<SimulationTrace | null>(null);
  const playback = useSimulationPlayback(trace);
  const byKey = (key: string) => rules.find((r) => r.key === key);

  return (
    <div className="flex w-full flex-col gap-4">
      <SequenceEditor<Rule>
        // Open on the node flow: the run reads as a path from Start to the decision.
        defaultView="flow"
        items={rules}
        getKey={(rule) => rule.key}
        getLabel={(rule) => rule.name}
        getDescription={(rule) => `${rule.category} · ${rule.action}`}
        value={sequence}
        // Editing the sequence makes the last run stale.
        onValueChange={(keys) => {
          setSequence(keys);
          setTrace(null);
        }}
        simulation={trace ? { trace, step: playback.step } : undefined}
        labels={{ title: "Risk rule sequence", panelTab: "Rules", searchPlaceholder: "Search rules…" }}
      />
      <SimulationPanel
        title="Test a transaction"
        trace={trace}
        playback={playback}
        getLabel={(key) => byKey(key)?.name ?? key}
        onRun={() =>
          setTrace(simulateSequence(sequence, byKey, evaluate, tx, { label: "Approved", tone: "success", detail: "No rule stopped it" }))
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="tx-payee" className="text-xs">Payee VPA</Label>
            <Input id="tx-payee" value={tx.payee} onChange={(e) => setTx({ ...tx, payee: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tx-amount" className="text-xs">Amount (₹)</Label>
            <Input id="tx-amount" type="number" value={tx.amount} onChange={(e) => setTx({ ...tx, amount: Number(e.target.value) })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tx-velocity" className="text-xs">Payments / hour</Label>
            <Input id="tx-velocity" type="number" value={tx.paymentsLastHour} onChange={(e) => setTx({ ...tx, paymentsLastHour: Number(e.target.value) })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tx-hour" className="text-xs">Hour (0–23)</Label>
            <Input id="tx-hour" type="number" min={0} max={23} value={tx.hour} onChange={(e) => setTx({ ...tx, hour: Number(e.target.value) })} />
          </div>
          <div className="flex items-end gap-2 pb-2">
            <Checkbox id="tx-device" checked={tx.newDevice} onCheckedChange={(v) => setTx({ ...tx, newDevice: v === true })} />
            <Label htmlFor="tx-device" className="text-xs font-normal">New device</Label>
          </div>
        </div>
      </SimulationPanel>
    </div>
  );
}
