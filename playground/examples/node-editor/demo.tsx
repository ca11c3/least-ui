import { NodeEditor, type EditorGraph } from "leastui";

// The basic editor: no node types, no setup. Each node is a card titled by data.label.
const graph: EditorGraph = {
  nodes: [
    { id: "a", position: { x: 0, y: 0 }, data: { label: "Collect order" } },
    { id: "b", position: { x: -130, y: 120 }, data: { label: "Charge card" } },
    { id: "c", position: { x: 130, y: 120 }, data: { label: "Reserve stock" } },
    { id: "d", position: { x: 0, y: 240 }, data: { label: "Ship" } },
  ],
  edges: [
    { id: "a-b", source: "a", target: "b" },
    { id: "a-c", source: "a", target: "c" },
    { id: "b-d", source: "b", target: "d" },
    { id: "c-d", source: "c", target: "d" },
  ],
};

export default function NodeEditorDemo() {
  return <NodeEditor className="w-full" defaultValue={graph} height={420} />;
}
