import { useState } from "react";
import { Scheduler, type SchedulerEvent } from "leastui";

const today = new Date();
const at = (dayOffset: number, hour = 0, minute = 0) =>
  new Date(today.getFullYear(), today.getMonth(), today.getDate() + dayOffset, hour, minute);

// Dragging or editing one occurrence moves the whole series.
const initialEvents: SchedulerEvent[] = [
  { id: "standup", title: "Stand-up", start: at(-14, 9, 30), end: at(-14, 9, 45), rrule: "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR", color: "teal" },
  { id: "gym", title: "Gym", start: at(-14, 18), end: at(-14, 19), rrule: "FREQ=WEEKLY;BYDAY=TU,TH", color: "lime" },
  { id: "retro", title: "Retro", start: at(-7, 16), end: at(-7, 17), rrule: "FREQ=WEEKLY;INTERVAL=2", color: "purple" },
  { id: "payday", title: "Payday", start: at(-30), end: at(-30), allDay: true, rrule: "FREQ=MONTHLY;BYDAY=-1FR", color: "green" },
  { id: "course", title: "Evening course", start: at(-3, 19), end: at(-3, 21), rrule: "FREQ=WEEKLY;COUNT=6", color: "indigo" },
];

export default function SchedulerRecurring() {
  const [events, setEvents] = useState(initialEvents);

  return <Scheduler events={events} onEventsChange={setEvents} defaultView="month" />;
}
