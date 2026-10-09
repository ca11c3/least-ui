import { AreaChart, StatTile, formatCompact } from "leastui";
import { traffic } from "./data";

const visits = traffic.map((d) => d.organic + d.paid + d.referral);

export default function ChartDemo() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Visits"
          value={visits.reduce((a, b) => a + b, 0)}
          delta={{ value: 0.124, period: "vs previous 30 days" }}
          trend={visits}
        />
        <StatTile label="Conversion rate" value="3.8%" delta={{ value: -0.006, period: "vs previous 30 days" }} />
        <StatTile
          label="Bounce rate"
          value="41.2%"
          delta={{ value: -0.031, period: "vs previous 30 days", good: "down" }}
        />
      </div>
      <AreaChart
        title="Visits by channel"
        description="Daily sessions, last 30 days"
        data={traffic}
        x="date"
        series={[
          { key: "organic", label: "Organic" },
          { key: "paid", label: "Paid" },
          { key: "referral", label: "Referral" },
        ]}
        stacked
        curve="smooth"
        formatValue={(n) => formatCompact(n)}
      />
    </div>
  );
}
