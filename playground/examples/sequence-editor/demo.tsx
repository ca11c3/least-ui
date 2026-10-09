import { useState } from "react";
import { Badge, SequenceEditor, toast } from "leastui";
import { actionColor, rules, type Rule } from "./rules";

export default function SequenceEditorDemo() {
  const [sequence, setSequence] = useState(["blocklist-vpa", "velocity-1h"]);

  return (
    <SequenceEditor<Rule>
      className="w-full"
      items={rules}
      getKey={(rule) => rule.key}
      getLabel={(rule) => rule.name}
      getDescription={(rule) => `${rule.category} · ${rule.action}`}
      getSearchText={(rule) => `${rule.name} ${rule.category} ${rule.action}`}
      renderItem={(rule) => (
        <>
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="outline" className="h-5">{rule.category}</Badge>
            <Badge variant="secondary" color={actionColor[rule.action]} className="h-5">{rule.action}</Badge>
          </div>
          <p className="truncate text-sm leading-5 font-medium">{rule.name}</p>
        </>
      )}
      value={sequence}
      onValueChange={setSequence}
      onItemClick={(rule) => toast(rule.name)}
      labels={{
        title: "Risk rule sequence",
        description: "Drag rules from the panel into the sequence, then arrange the order in which they run.",
        workspaceDescription: "The order matters: rules are checked top to bottom.",
        searchPlaceholder: "Search rules…",
        empty: "Drag rules from the panel to build the sequence.",
        noMatches: "No matching rules.",
        panelTab: "Rules",
      }}
    />
  );
}
