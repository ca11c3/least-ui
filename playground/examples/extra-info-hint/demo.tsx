import { ExtraInfoHint } from "leastui";

export default function ExtraInfoHintDemo() {
  return (
    <div className="flex items-center text-sm font-medium">
      Settlement period
      <ExtraInfoHint>
        <p className="font-medium">How settlement works</p>
        <p className="text-muted-foreground mt-1">
          Payments are grouped by day and paid out two business days later.
        </p>
      </ExtraInfoHint>
    </div>
  );
}
