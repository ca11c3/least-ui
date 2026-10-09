import { RadialChart } from "leastui";

const goals = [
  { goal: "Revenue", progress: 84 },
  { goal: "New customers", progress: 62 },
  { goal: "Retention", progress: 91 },
  { goal: "NPS", progress: 47 },
];

export default function ChartRadial() {
  return (
    <div className="grid w-full gap-4 md:grid-cols-2">
      <RadialChart
        title="Quarterly goals"
        description="Percent of target"
        data={goals}
        label="goal"
        value="progress"
        max={100}
        formatValue={(n) => `${n}%`}
      />
      <RadialChart
        title="Storage"
        description="Gauge: pass sweep={180}"
        data={[{ name: "Used", gb: 412 }]}
        label="name"
        value="gb"
        max={500}
        sweep={180}
        formatValue={(n) => `${n} GB`}
        centerLabel="of 500 GB used"
      />
    </div>
  );
}
