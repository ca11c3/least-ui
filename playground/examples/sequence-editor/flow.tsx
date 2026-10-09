import { useState } from "react";
import { Badge, SequenceEditor } from "leastui";
import { actionColor, rules, type Rule } from "./rules";

// The same editor opened on its flow view. `renderStep` decides what a step
// shows, in the list and in the flow alike. Draw an edge to re-rank, drag a step
// up or down by its header, or drop a card from the panel between two steps.
export default function SequenceEditorFlow() {
  const [sequence, setSequence] = useState(["blocklist-vpa", "velocity-1h", "amount-high"]);

  return (
    <SequenceEditor<Rule>
      className="w-full"
      defaultView="flow"
      items={rules}
      getKey={(rule) => rule.key}
      getLabel={(rule) => rule.name}
      getDescription={(rule) => `${rule.category} · ${rule.action}`}
      renderStep={(rule) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{rule.name}</p>
          <div className="mt-1.5 flex gap-1.5">
            <Badge variant="outline" className="h-5 px-2">{rule.category}</Badge>
            <Badge variant="secondary" color={actionColor[rule.action]} className="h-5 px-2">{rule.action}</Badge>
          </div>
        </div>
      )}
      value={sequence}
      onValueChange={setSequence}
      labels={{ title: "Risk rule sequence", panelTab: "Rules", searchPlaceholder: "Search rules…" }}
    />
  );
}
