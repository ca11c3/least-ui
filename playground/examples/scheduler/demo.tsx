import { useState } from "react";
import { Scheduler, type SchedulerEvent } from "leastui";

// Dates relative to this week, so the demo always has something to show.
const today = new Date();
const at = (dayOffset: number, hour = 0, minute = 0) =>
  new Date(today.getFullYear(), today.getMonth(), today.getDate() + dayOffset, hour, minute);

const initialEvents: SchedulerEvent[] = [
  { id: "1", title: "Design review", start: at(0, 10), end: at(0, 11, 30), color: "purple", description: "Walk through the new onboarding flow." },
  { id: "2", title: "1:1 with Sam", start: at(0, 10, 30), end: at(0, 11), color: "teal" },
  { id: "3", title: "Lunch", start: at(0, 12, 30), end: at(0, 13, 30), color: "amber" },
  { id: "4", title: "Sprint planning", start: at(1, 9), end: at(1, 10, 30), color: "indigo" },
  { id: "5", title: "Customer call", start: at(-1, 15), end: at(-1, 16), color: "orange" },
  { id: "6", title: "Offsite", start: at(2), end: at(3), allDay: true, color: "green" },
  { id: "7", title: "Release v2.0", start: at(-2), end: at(-2), allDay: true, color: "pink" },
  { id: "8", title: "Late deploy", start: at(1, 21), end: at(2, 1), color: "red" },
];

export default function SchedulerDemo() {
  const [events, setEvents] = useState(initialEvents);

  return <Scheduler events={events} onEventsChange={setEvents} />;
}
