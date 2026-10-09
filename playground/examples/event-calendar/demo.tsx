import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button, Checkbox, EventCalendar, Label, toast, type CalendarEvent } from "leastui";

const categories = [
  { id: "family", label: "Family", color: "rgb(234 179 8)" },
  { id: "business", label: "Business", color: "rgb(139 92 246)" },
  { id: "personal", label: "Personal", color: "rgb(244 63 94)" },
  { id: "holiday", label: "Holiday", color: "rgb(34 197 94)" },
  { id: "etc", label: "Etc", color: "rgb(14 165 233)" },
] as const;

type Category = (typeof categories)[number]["id"];

// Dates relative to the current month, so the demo always has something to show.
const now = new Date();
const on = (day: number, hour?: number, minute = 0) =>
  new Date(now.getFullYear(), now.getMonth(), day, hour ?? 0, minute);

const sampleEvents: (CalendarEvent & { category: Category })[] = [
  { id: "1", title: "Project deadline", start: on(1, 13), category: "business", completed: true },
  { id: "2", title: "Weekly team sync", start: on(8, 10), category: "business", completed: true },
  { id: "3", title: "Morning yoga & meditation", start: on(10, 8), category: "personal" },
  { id: "4", title: "Product launch – mobile app", start: on(11), end: on(15), allDay: true, category: "business" },
  { id: "5", title: "Lunch with client", start: on(11, 12), category: "business" },
  { id: "6", title: "Sales conference", start: on(12, 14, 30), end: on(13, 17), category: "business" },
  { id: "7", title: "Weekly team sync", start: on(13, 9), category: "business" },
  { id: "8", title: "Dentist", start: on(13, 16), category: "personal" },
  { id: "9", title: "Pick up groceries", start: on(13, 18), category: "family" },
  { id: "10", title: "Car service appointment", start: on(14, 11), category: "etc" },
  { id: "11", title: "Kids' school sports day", start: on(16), allDay: true, category: "family" },
  { id: "12", title: "Marketing strategy review", start: on(19, 10), category: "business" },
  { id: "13", title: "Annual shareholders meeting", start: on(25), allDay: true, category: "business" },
  { id: "14", title: "Summer holiday – Europe", start: on(27), end: on(33), allDay: true, category: "holiday" },
];

export default function EventCalendarDemo() {
  const [visible, setVisible] = useState<Set<Category>>(new Set(categories.map((c) => c.id)));

  const toggle = (id: Category, checked: boolean) =>
    setVisible((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

  const colorOf = (id: Category) => categories.find((c) => c.id === id)!.color;
  const events = sampleEvents
    .filter((event) => visible.has(event.category))
    .map((event) => ({ ...event, color: colorOf(event.category) }));

  return (
    <div className="flex w-full flex-col gap-4 lg:flex-row">
      <aside className="flex shrink-0 flex-col gap-4 lg:w-48">
        <Button onClick={() => toast("New event")}>
          <PlusIcon />
          New event
        </Button>
        <div className="flex flex-col gap-2.5">
          <p className="text-sm font-medium">Event filters</p>
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-2">
              <Checkbox
                id={`filter-${category.id}`}
                checked={visible.has(category.id)}
                onCheckedChange={(checked) => toggle(category.id, checked === true)}
                style={{ "--primary": category.color } as React.CSSProperties}
              />
              <Label htmlFor={`filter-${category.id}`} className="font-normal">
                {category.label}
              </Label>
            </div>
          ))}
        </div>
      </aside>
      <EventCalendar
        className="min-w-0 flex-1"
        events={events}
        onEventClick={(event) => toast(event.title)}
        onDayClick={(day) => toast(`New event on ${day.toDateString()}`)}
      />
    </div>
  );
}
