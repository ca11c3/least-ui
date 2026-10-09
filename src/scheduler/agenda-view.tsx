import * as React from "react";
import dayjs, { type Dayjs } from "dayjs";
import { CalendarXIcon, RepeatIcon } from "lucide-react";

import { cn } from "../lib/utils";
import { useScheduler } from "./context";
import type { Occurrence, SchedulerResource } from "./types";
import { firstDay, formatTime, lastDay, sortOccurrences } from "./utils";

export function AgendaView({
  start,
  days: dayCount,
  occurrences,
  resources,
}: {
  start: Dayjs;
  days: number;
  occurrences: Occurrence[];
  resources: SchedulerResource[];
}) {
  const { colorOf, ampm, openEvent, goToDay } = useScheduler();
  const today = dayjs();

  const groups = Array.from({ length: dayCount }, (_, i) => start.add(i, "day"))
    .map((day) => ({
      day,
      items: occurrences
        .filter((o) => {
          const item = { ...o, allDay: o.event.allDay };
          return !firstDay(item).isAfter(day) && !lastDay(item).isBefore(day);
        })
        .sort(sortOccurrences),
    }))
    .filter((group) => group.items.length > 0);

  const timeLabel = (o: Occurrence, day: Dayjs) => {
    if (o.event.allDay) return "All day";
    const startsToday = dayjs(o.start).isSame(day, "day");
    const endsToday = lastDay(o).isSame(day, "day");
    if (startsToday && endsToday) return `${formatTime(o.start, ampm)} – ${formatTime(o.end, ampm)}`;
    if (startsToday) return `From ${formatTime(o.start, ampm)}`;
    if (endsToday) return `Until ${formatTime(o.end, ampm)}`;
    return "All day";
  };

  if (groups.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 p-10 text-sm">
        <CalendarXIcon className="size-8 opacity-60" />
        No events in this period
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {groups.map(({ day, items }) => {
        const isToday = day.isSame(today, "day");
        return (
          <section key={day.valueOf()} className="flex gap-4 border-b px-3 py-3 last:border-b-0 sm:px-4">
            <button
              type="button"
              onClick={() => goToDay(day.toDate())}
              className="hover:bg-muted focus-visible:ring-ring/50 flex w-14 shrink-0 flex-col items-center self-start rounded-lg py-1 outline-none focus-visible:ring-2"
            >
              <span
                className={cn(
                  "inline-grid size-9 place-items-center rounded-full text-xl leading-none font-semibold",
                  isToday && "bg-primary text-primary-foreground",
                )}
              >
                {day.date()}
              </span>
              <span className={cn("text-xs", isToday ? "text-primary font-medium" : "text-muted-foreground")}>
                {day.format("MMM, ddd")}
              </span>
            </button>

            <ul className="flex min-w-0 flex-1 flex-col gap-1">
              {items.map((occurrence) => {
                const { event } = occurrence;
                const resource = resources.find((r) => r.id === event.resource);
                return (
                  <li key={occurrence.key}>
                    <button
                      type="button"
                      data-slot="scheduler-event"
                      onClick={() => openEvent(occurrence)}
                      style={{ "--event-color": colorOf(event) } as React.CSSProperties}
                      className={cn(
                        "hover:bg-muted focus-visible:ring-ring/50 flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm outline-none focus-visible:ring-2",
                        event.className,
                      )}
                    >
                      <span className="bg-(--event-color) h-8 w-1 shrink-0 rounded-full" />
                      <span className="text-muted-foreground w-32 shrink-0 text-xs tabular-nums">
                        {timeLabel(occurrence, day)}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="flex items-center gap-1.5 truncate font-medium">
                          <span className="truncate">{event.title}</span>
                          {event.rrule && <RepeatIcon className="text-muted-foreground size-3 shrink-0" />}
                        </span>
                        {(resource || event.description) && (
                          <span className="text-muted-foreground truncate text-xs">
                            {[resource?.title, event.description].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
