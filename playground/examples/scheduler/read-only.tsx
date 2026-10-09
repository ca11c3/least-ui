import { useState } from "react";
import { Scheduler, type SchedulerEvent } from "leastui";

const today = new Date();
const at = (dayOffset: number, hour = 0, minute = 0) =>
  new Date(today.getFullYear(), today.getMonth(), today.getDate() + dayOffset, hour, minute);

const initialEvents: SchedulerEvent[] = [
  { id: "1", title: "Locked: board meeting", start: at(0, 9), end: at(0, 11), readOnly: true, color: "red" },
  { id: "2", title: "Fixed start, resize end only", start: at(0, 13), end: at(0, 14), resizable: "end", color: "blue" },
  { id: "3", title: "Not draggable", start: at(1, 10), end: at(1, 11), draggable: false, color: "amber" },
  { id: "4", title: "Free to move", start: at(1, 14), end: at(1, 15, 30), color: "green" },
];

export default function SchedulerReadOnly() {
  const [events, setEvents] = useState(initialEvents);

  return (
    <Scheduler
      events={events}
      onEventsChange={setEvents}
      views={["day", "week"]}
      ampm={false}
      eventCreation={{ interaction: "click", duration: 30 }}
    />
  );
}
