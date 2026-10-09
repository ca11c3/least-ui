import { Badge } from "leastui";

export default function BadgeCustomColor() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge color="var(--success)">Paid</Badge>
      <Badge variant="secondary" color="var(--warning)">Pending</Badge>
      <Badge variant="secondary" color="rgb(13 148 136)">Shipped</Badge>
      <Badge variant="outline" color="rgb(234 88 12)">Backorder</Badge>
    </div>
  );
}
