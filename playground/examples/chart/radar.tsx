import { RadarChart } from "leastui";

const skills = [
  { skill: "Speed", current: 82, previous: 70 },
  { skill: "Reliability", current: 91, previous: 88 },
  { skill: "Security", current: 74, previous: 61 },
  { skill: "Usability", current: 68, previous: 72 },
  { skill: "Support", current: 85, previous: 79 },
  { skill: "Price", current: 60, previous: 66 },
];

export default function ChartRadar() {
  return (
    <RadarChart
      className="w-full"
      title="Product scorecard"
      description="Customer survey, out of 100"
      data={skills}
      x="skill"
      series={[
        { key: "current", label: "This quarter" },
        { key: "previous", label: "Last quarter" },
      ]}
      max={100}
    />
  );
}
