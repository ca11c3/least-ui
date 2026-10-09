import { useState } from "react";
import { BanIcon, CheckIcon, GitForkIcon, HourglassIcon } from "lucide-react";
import {
  Input,
  Label,
  NodeEditor,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SimulationPanel,
  simulateGraph,
  useSimulationPlayback,
  type EditorGraph,
  type NodeType,
  type SimulationTrace,
} from "leastui";

type Tx = { amount: number; country: string; deviceAgeDays: number };
type Data = { field?: keyof Tx; operator?: ">" | "<" | "=" | "≠"; value?: string };

const fieldNames: Record<keyof Tx, string> = { amount: "Amount", country: "Country", deviceAgeDays: "Device age (days)" };

function compare(actual: string | number, operator: Data["operator"], expected: string) {
  const a = typeof actual === "number" ? actual : String(actual).toUpperCase();
  const b = typeof actual === "number" ? Number(expected) : expected.toUpperCase();
  return operator === ">" ? a > b : operator === "<" ? a < b : operator === "=" ? a === b : a !== b;
}

const decisions = {
  approve: { label: "Approve", tone: "success", icon: <CheckIcon />, color: 6 },
  review: { label: "Manual review", tone: "warning", icon: <HourglassIcon />, color: 4 },
  block: { label: "Block", tone: "danger", icon: <BanIcon />, color: 8 },
} as const;

// `evaluate` is what a node does with the test input. The editor never runs it;
// simulateGraph does, and the result is drawn on the canvas.
const nodeTypes: Record<string, NodeType<Data>> = {
  start: {
    label: "Payment received",
    frame: "terminal",
    color: 1,
    inputs: 0,
    evaluate: () => ({ note: "Received" }),
  },
  condition: {
    label: "Condition",
    icon: <GitForkIcon />,
    color: 7,
    outputs: ["Yes", "No"],
    title: (d) => `${fieldNames[d.field ?? "amount"]} ${d.operator} ${d.value}`,
    evaluate: (data, input: Tx) => {
      const actual = input[data.field ?? "amount"];
      const yes = compare(actual, data.operator, data.value ?? "");
      return {
        output: yes ? "Yes" : "No",
        note: yes ? "Yes" : "No",
        detail: `${fieldNames[data.field ?? "amount"]} is ${typeof actual === "number" ? actual.toLocaleString() : actual}`,
      };
    },
  },
  // One type per decision, so each gets its own colour and icon.
  ...Object.fromEntries(
    Object.entries(decisions).map(([key, d]) => [
      key,
      {
        label: d.label,
        icon: d.icon,
        color: d.color,
        outputs: 0,
        evaluate: () => ({ tone: d.tone, note: d.label, stop: true, outcome: { label: d.label, tone: d.tone } }),
      } satisfies NodeType<Data>,
    ]),
  ),
};

const graph: EditorGraph<Data> = {
  nodes: [
    { id: "start", type: "start", position: { x: 48, y: 0 }, data: {} },
    { id: "big", type: "condition", position: { x: 0, y: 90 }, data: { field: "amount", operator: ">", value: "50000" } },
    { id: "abroad", type: "condition", position: { x: -170, y: 230 }, data: { field: "country", operator: "≠", value: "IN" } },
    { id: "newdev", type: "condition", position: { x: 170, y: 230 }, data: { field: "deviceAgeDays", operator: "<", value: "2" } },
    { id: "block", type: "block", position: { x: -300, y: 380 }, data: {} },
    { id: "review", type: "review", position: { x: 0, y: 380 }, data: {} },
    { id: "approve", type: "approve", position: { x: 300, y: 380 }, data: {} },
  ],
  edges: [
    { id: "1", source: "start", target: "big" },
    { id: "2", source: "big", target: "abroad", sourceHandle: "Yes", label: "Yes" },
    { id: "3", source: "big", target: "newdev", sourceHandle: "No", label: "No" },
    { id: "4", source: "abroad", target: "block", sourceHandle: "Yes", label: "Yes" },
    { id: "5", source: "abroad", target: "review", sourceHandle: "No", label: "No" },
    { id: "6", source: "newdev", target: "review", sourceHandle: "Yes", label: "Yes" },
    { id: "7", source: "newdev", target: "approve", sourceHandle: "No", label: "No" },
  ],
};

export default function NodeEditorSimulate() {
  const [tx, setTx] = useState<Tx>({ amount: 75000, country: "MY", deviceAgeDays: 30 });
  const [trace, setTrace] = useState<SimulationTrace | null>(null);
  const playback = useSimulationPlayback(trace);
  const label = (id: string) => {
    const node = graph.nodes.find((n) => n.id === id)!;
    const type = nodeTypes[node.type!];
    return type.title?.(node.data) ?? type.label;
  };

  return (
    <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <NodeEditor
        nodeTypes={nodeTypes}
        value={graph}
        readOnly
        height={540}
        simulation={trace ? { trace, step: playback.step } : undefined}
      />
      <SimulationPanel
        title="Test a payment"
        trace={trace}
        playback={playback}
        getLabel={label}
        onRun={() => setTrace(simulateGraph(graph, nodeTypes, tx))}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="sim-amount" className="text-xs">Amount</Label>
            <Input id="sim-amount" type="number" value={tx.amount} onChange={(e) => setTx({ ...tx, amount: Number(e.target.value) })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Country</Label>
            <Select value={tx.country} onValueChange={(country) => setTx({ ...tx, country })}>
              <SelectTrigger className="w-full" aria-label="Country">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["IN", "MY", "SG", "US"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sim-device" className="text-xs">Device age</Label>
            <Input id="sim-device" type="number" value={tx.deviceAgeDays} onChange={(e) => setTx({ ...tx, deviceAgeDays: Number(e.target.value) })} />
          </div>
        </div>
      </SimulationPanel>
    </div>
  );
}
