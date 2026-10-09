import { PieChart } from "leastui";

const browsers = [
  { browser: "Chrome", visitors: 27_500 },
  { browser: "Safari", visitors: 20_100 },
  { browser: "Firefox", visitors: 8_700 },
  { browser: "Edge", visitors: 7_300 },
  { browser: "Samsung Internet", visitors: 2_900 },
  { browser: "Opera", visitors: 1_400 },
  { browser: "Brave", visitors: 900 },
];

// Hover a slice or a row: the centre answers. Past 6 slices, the smallest fold into "Other".
export default function ChartPie() {
  return (
    <PieChart
      className="w-full"
      title="Visitors by browser"
      description="Last 30 days"
      data={browsers}
      label="browser"
      value="visitors"
      centerLabel="Visitors"
    />
  );
}
