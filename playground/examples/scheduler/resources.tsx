import { useState } from "react";
import { Scheduler, type SchedulerEvent, type SchedulerResource } from "leastui";

const today = new Date();
const at = (dayOffset: number, hour = 0, minute = 0) =>
  new Date(today.getFullYear(), today.getMonth(), today.getDate() + dayOffset, hour, minute);

// Events take their resource's colour unless they set their own.
const resources: SchedulerResource[] = [
  { id: "room-a", title: "Room A", eventColor: "blue" },
  { id: "room-b", title: "Room B", eventColor: "green" },
  { id: "room-c", title: "Room C", eventColor: "orange" },
];

const initialEvents: SchedulerEvent[] = [
  { id: "1", title: "Maths", start: at(0, 9), end: at(0, 10), resource: "room-a" },
  { id: "2", title: "Physics", start: at(0, 9), end: at(0, 10, 30), resource: "room-b" },
  { id: "3", title: "History", start: at(0, 11), end: at(0, 12), resource: "room-c" },
  { id: "4", title: "Chemistry", start: at(1, 13), end: at(1, 14, 30), resource: "room-b" },
  { id: "5", title: "Exam", start: at(2, 9), end: at(2, 12), resource: "room-a", color: "red" },
  { id: "6", title: "Open day", start: at(3), end: at(3), allDay: true, resource: "room-c" },
];

export default function SchedulerResources() {
  const [events, setEvents] = useState(initialEvents);

  return (
    <Scheduler
      events={events}
      onEventsChange={setEvents}
      resources={resources}
      defaultView="week"
      weekStartsOn={1}
    />
  );
}
