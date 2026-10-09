import { LineChart } from "leastui";
import { latency } from "./data";

// Lines are labelled at their ends while there's room; a gap in the data is a gap in the line.
export default function ChartLine() {
  return (
    <LineChart
      className="w-full"
      title="API latency"
      description="Milliseconds, today. p99 is missing at 14:00."
      data={latency}
      x="hour"
      series={[
        { key: "p50", label: "p50" },
        { key: "p95", label: "p95" },
        { key: "p99", label: "p99" },
      ]}
      zeroBaseline
      formatValue={(n) => `${Math.round(n)} ms`}
    />
  );
}
