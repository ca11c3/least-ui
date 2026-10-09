import { BarChart } from "leastui";

const signups = [
  { country: "India", signups: 4210 },
  { country: "United States", signups: 2980 },
  { country: "Indonesia", signups: 1870 },
  { country: "Brazil", signups: 1240 },
  { country: "United Kingdom", signups: 960 },
  { country: "Malaysia", signups: 720 },
];

// One story: grey the rest so the highlighted bar carries it.
export default function ChartHorizontal() {
  return (
    <BarChart
      className="w-full"
      title="Sign-ups by country"
      description="Malaysia launched last month"
      data={signups}
      x="country"
      series={[{ key: "signups", label: "Sign-ups" }]}
      orientation="horizontal"
      showValues
      highlight={(row) => row.country === "Malaysia"}
    />
  );
}
