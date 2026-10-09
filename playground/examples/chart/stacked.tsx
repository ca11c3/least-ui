import { BarChart, formatCompact } from "leastui";
import { revenueByMonth } from "./data";

export default function ChartStacked() {
  return (
    <BarChart
      className="w-full"
      title="Total revenue"
      description="Stacked by channel, with the total at each bar's tip"
      data={revenueByMonth}
      x="month"
      series={[
        { key: "online", label: "Online" },
        { key: "retail", label: "Retail" },
      ]}
      stacked
      showValues
      formatValue={(n) => `$${formatCompact(n)}`}
    />
  );
}
