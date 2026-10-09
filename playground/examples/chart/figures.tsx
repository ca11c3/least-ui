import { Meter, Sparkline, StatTile } from "leastui";

const mrr = [41, 42.5, 43.1, 44.8, 44.2, 46.9, 48.3, 47.7, 50.2, 52.8, 54.1, 57.6];

export default function ChartFigures() {
  return (
    <div className="grid w-full gap-4 md:grid-cols-2">
      <StatTile
        label="Monthly recurring revenue"
        value={57600}
        format={(n) => `$${(n / 1000).toFixed(1)}K`}
        delta={{ value: 0.064, period: "vs last month" }}
        trend={mrr}
        size="hero"
      />
      <div className="bg-card flex flex-col justify-center gap-5 rounded-xl border p-5">
        <Meter label="Storage" value={42} />
        <Meter label="API quota" value={78} thresholds={{ warning: 75, critical: 90 }} />
        <Meter label="Error budget used" value={94} thresholds={{ warning: 75, critical: 90 }} statusLabels={{ critical: "Over budget" }} />
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground w-28 shrink-0">Weekly signups</span>
          <Sparkline data={[12, 18, 15, 22, 19, 27, 31]} height={24} />
        </div>
      </div>
    </div>
  );
}
