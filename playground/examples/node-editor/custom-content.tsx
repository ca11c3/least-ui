import { useState } from "react";
import { GitForkIcon, MessageSquareIcon, StickyNoteIcon } from "lucide-react";
import {
  Input,
  NodeEditor,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  type EditorGraph,
  type NodeType,
} from "leastui";

type Data = {
  field?: string;
  operator?: string;
  value?: string;
  message?: string;
  note?: string;
};

// You decide what each node shows. `render` gets the node's data and `update`
// to change it; whatever you return goes in the card under its title.
const nodeTypes: Record<string, NodeType<Data>> = {
  start: { label: "Start", frame: "terminal", color: 1, inputs: 0, maxCount: 1, palette: false },
  condition: {
    label: "Condition",
    description: "Branch on a field",
    icon: <GitForkIcon />,
    color: 7,
    outputs: ["Yes", "No"],
    defaultData: { field: "amount", operator: ">", value: "" },
    render: ({ data, update, readOnly }) => (
      <div className="flex flex-col gap-2">
        <Select value={data.field} onValueChange={(field) => update({ field })} disabled={readOnly}>
          <SelectTrigger size="sm" className="w-full">
            <SelectValue placeholder="Field" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="amount">Amount</SelectItem>
            <SelectItem value="country">Country</SelectItem>
            <SelectItem value="device">Device age (days)</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Select value={data.operator} onValueChange={(operator) => update({ operator })} disabled={readOnly}>
            <SelectTrigger size="sm" className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[">", "<", "=", "≠"].map((op) => (
                <SelectItem key={op} value={op}>
                  {op}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            className="h-8"
            placeholder="Value"
            value={data.value ?? ""}
            onChange={(e) => update({ value: e.target.value })}
            readOnly={readOnly}
          />
        </div>
      </div>
    ),
  },
  message: {
    label: "Send message",
    description: "Email the customer",
    icon: <MessageSquareIcon />,
    color: 2,
    defaultData: { message: "" },
    render: ({ data, update, readOnly }) => (
      <Textarea
        rows={3}
        placeholder="Write the message…"
        value={data.message ?? ""}
        onChange={(e) => update({ message: e.target.value })}
        readOnly={readOnly}
        className="min-h-0 resize-none text-sm"
      />
    ),
  },
  // frame: "none" draws only your content: here, a sticky note with no connections.
  note: {
    label: "Note",
    description: "A comment on the canvas",
    icon: <StickyNoteIcon />,
    color: 4,
    frame: "none",
    inputs: 0,
    outputs: 0,
    defaultData: { note: "" },
    render: ({ data, update }) => (
      <textarea
        className="nodrag nowheel h-28 w-48 resize-none rounded-md bg-amber-100 p-3 text-sm text-amber-950 shadow-md outline-none placeholder:text-amber-900/50 dark:bg-amber-200"
        placeholder="Write a note…"
        value={data.note ?? ""}
        onChange={(e) => update({ note: e.target.value })}
      />
    ),
  },
  end: { label: "End", frame: "terminal", color: 6, outputs: 0 },
};

const initial: EditorGraph<Data> = {
  nodes: [
    { id: "s", type: "start", position: { x: 47, y: 0 }, data: {} },
    { id: "c", type: "condition", position: { x: 0, y: 100 }, data: { field: "amount", operator: ">", value: "50000" } },
    { id: "m", type: "message", position: { x: -170, y: 330 }, data: { message: "Your payment is being reviewed." } },
    { id: "e", type: "end", position: { x: 210, y: 360 }, data: {} },
    { id: "n", type: "note", position: { x: 300, y: 80 }, data: { note: "Large payments go to manual review first." } },
  ],
  edges: [
    { id: "s-c", source: "s", target: "c" },
    { id: "c-m", source: "c", target: "m", sourceHandle: "Yes", label: "Yes" },
    { id: "c-e", source: "c", target: "e", sourceHandle: "No", label: "No" },
  ],
};

export default function NodeEditorCustomContent() {
  const [graph, setGraph] = useState(initial);

  return (
    <div className="flex w-full flex-col gap-3">
      <NodeEditor nodeTypes={nodeTypes} value={graph} onValueChange={setGraph} height={560} />
      <details className="text-sm">
        <summary className="text-muted-foreground cursor-pointer">Node data</summary>
        <pre className="bg-muted mt-2 max-h-60 overflow-auto rounded-md p-3 text-xs">
          {JSON.stringify(graph.nodes.map(({ id, type, data }) => ({ id, type, data })), null, 2)}
        </pre>
      </details>
    </div>
  );
}
