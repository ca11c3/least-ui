import { DatabaseIcon, FileInputIcon, FilterIcon, SendIcon, SigmaIcon } from "lucide-react";
import { NodeEditor, layeredLayout, type EditorGraph, type NodeType } from "leastui";

type Step = { label: string; detail: string };

// One small render shared by every type: the step's detail under its title.
const detail: NodeType<Step>["render"] = ({ data }) => <p className="text-muted-foreground text-xs">{data.detail}</p>;

const nodeTypes: Record<string, NodeType<Step>> = {
  source: { label: "Source", icon: <FileInputIcon />, color: 1, inputs: 0, render: detail },
  filter: { label: "Filter", icon: <FilterIcon />, color: 3, render: detail },
  aggregate: { label: "Aggregate", icon: <SigmaIcon />, color: 7, render: detail },
  sink: { label: "Destination", icon: <DatabaseIcon />, color: 6, outputs: 0, render: detail },
  alert: { label: "Alert", icon: <SendIcon />, color: 2, outputs: 0, render: detail },
};

const edges = [
  { id: "1", source: "in", target: "f" },
  { id: "2", source: "f", target: "agg" },
  { id: "3", source: "agg", target: "wh" },
  { id: "4", source: "f", target: "al" },
];

// Positions come from the same layout as the editor's "Tidy up" button.
const graph: EditorGraph<Step> = {
  nodes: layeredLayout(
    [
      { id: "in", type: "source", position: { x: 0, y: 0 }, data: { label: "Orders", detail: "orders.csv" } },
      { id: "f", type: "filter", position: { x: 0, y: 0 }, data: { label: "Paid only", detail: "status = paid" } },
      { id: "agg", type: "aggregate", position: { x: 0, y: 0 }, data: { label: "Daily totals", detail: "Sum by day" } },
      { id: "wh", type: "sink", position: { x: 0, y: 0 }, data: { label: "Warehouse", detail: "analytics.daily" } },
      { id: "al", type: "alert", position: { x: 0, y: 1 }, data: { label: "Big orders", detail: "Amount > $10K" } },
    ],
    edges,
    { direction: "horizontal", nodeWidth: 224, nodeHeight: 96 },
  ),
  edges,
};

export default function NodeEditorReadOnly() {
  return (
    <NodeEditor className="w-full" nodeTypes={nodeTypes} value={graph} readOnly direction="horizontal" height={340} />
  );
}
