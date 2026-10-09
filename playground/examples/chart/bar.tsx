import { BarChart, formatCompact } from "leastui";
import { revenueByMonth } from "./data";

export default function ChartBar() {
  return (
    <BarChart
      className="w-full"
      title="Revenue by channel"
      description="First half of 2026"
      data={revenueByMonth}
      x="month"
      series={[
        { key: "online", label: "Online" },
        { key: "retail", label: "Retail" },
      ]}
      formatValue={(n) => `$${formatCompact(n)}`}
    />
  );
}
