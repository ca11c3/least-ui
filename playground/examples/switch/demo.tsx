import { Label, Switch } from "leastui";

export default function SwitchDemo() {
  return (
    <div className="flex items-center gap-3">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane mode</Label>
    </div>
  );
}
