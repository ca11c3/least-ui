import { SequenceEditor } from "leastui";
import { rules } from "./rules";

export default function SequenceEditorReadOnly() {
  return (
    <SequenceEditor
      className="w-full"
      readOnly
      items={rules}
      getKey={(rule) => rule.key}
      getLabel={(rule) => rule.name}
      getDescription={(rule) => `${rule.category} · ${rule.action}`}
      getItemHref={(rule) => `#/risk/rule/${rule.key}`}
      value={["blocklist-vpa", "trusted-merchant", "velocity-1h", "amount-high"]}
      labels={{ title: "Risk rule sequence" }}
    />
  );
}
