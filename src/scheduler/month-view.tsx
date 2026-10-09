import * as React from "react";
import dayjs, { type Dayjs } from "dayjs";

import { Popover, PopoverContent, PopoverTrigger } from "../components/popover";
import { cn } from "../lib/utils";
import { DAY_ATTR, dayKey, useScheduler } from "./context";
import { EventBar } from "./event-item";
import type { Occurrence } from "./types";
import { firstDay, lastDay, layoutRow, sortOccurrences } from "./utils";

export function monthRange(date: Dayjs, weekStartsOn: 0 | 1) {
  const month = date.startOf("month");
  const start = month.subtract((month.day() - weekStartsOn + 7) % 7, "day");
  const weeks = Math.ceil((month.daysInMonth() + month.diff(start, "day")) / 7);
  return { start, end: start.add(weeks, "week"), weeks };
}

export function MonthView({ date, occurrences }: { date: Dayjs; occurrences: Occurrence[] }) {
  const { weekStartsOn, maxEventsPerDay, creation, createEvent, goToDay } = useScheduler();
  const { start: gridStart, weeks: weekCount } = monthRange(date, weekStartsOn);
  const weeks = Array.from({ length: weekCount }, (_, i) => gridStart.add(i, "week"));
  const weekdayNames = Array.from({ length: 7 }, (_, i) => gridStart.add(i, "day").format("ddd"));
  const today = dayjs();

  const eventsOn = (day: Dayjs) =>
    occurrences
      .filter((o) => {
        const item = { ...o, allDay: o.event.allDay };
        return !firstDay(item).isAfter(day) && !lastDay(item).isBefore(day);
      })
      .sort(sortOccurrences);

  const create = (day: Dayjs) => {
    const d = day.toDate();
    createEvent(d, d, true);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-auto">
      <div className="flex min-w-[560px] flex-1 flex-col">
        <div className="text-muted-foreground grid grid-cols-7 border-b text-center text-xs font-medium">
          {weekdayNames.map((name) => (
            <div key={name} className="py-2">
              {name}
            </div>
          ))}
        </div>

        {weeks.map((weekStart) => {
          const segments = layoutRow(weekStart, 7, occurrences);
          const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, "day"));

          return (
            <div
              key={weekStart.valueOf()}
              className="relative flex-1 border-b last:border-b-0"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                gridTemplateRows: `2rem repeat(${maxEventsPerDay + 1}, 1.375rem)`,
                rowGap: "0.25rem",
                paddingBottom: "0.5rem",
              }}
            >
              {/* Day cells sit behind the events; they take creation clicks and drops. */}
              {days.map((day, col) => (
                <div
                  key={`bg-${col}`}
                  {...{ [DAY_ATTR]: dayKey(day) }}
                  onClick={creation?.interaction === "click" ? () => create(day) : undefined}
                  onDoubleClick={creation?.interaction === "double-click" ? () => create(day) : undefined}
                  className={cn(
                    "border-r last:border-r-0",
                    !day.isSame(date, "month") && "bg-muted/40",
                    creation && "hover:bg-muted/60",
                  )}
                  style={{ gridColumn: col + 1, gridRow: "1 / -1", marginBottom: "-0.5rem" }}
                />
              ))}

              {days.map((day, col) => {
                const isToday = day.isSame(today, "day");
                return (
                  <div
                    key={`date-${col}`}
                    className="pointer-events-none px-1.5 pt-1.5"
                    style={{ gridColumn: col + 1, gridRow: 1 }}
                  >
                    <button
                      type="button"
                      aria-label={day.format("dddd, D MMMM YYYY")}
                      onClick={() => goToDay(day.toDate())}
                      className={cn(
                        "pointer-events-auto inline-grid size-6 place-items-center rounded-full text-sm transition-colors",
                        "focus-visible:ring-ring/50 outline-none focus-visible:ring-2",
                        isToday
                          ? "bg-primary text-primary-foreground font-semibold"
                          : day.isSame(date, "month")
                            ? "text-foreground hover:bg-muted"
                            : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {day.date()}
                    </button>
                  </div>
                );
              })}

              {segments
                .filter((segment) => segment.lane < maxEventsPerDay)
                .map((segment) => (
                  <EventBar
                    key={segment.occurrence.key}
                    occurrence={segment.occurrence}
                    isStart={segment.isStart}
                    isEnd={segment.isEnd}
                    className="pointer-events-auto"
                    style={{
                      gridColumn: `${segment.startCol + 1} / span ${segment.span}`,
                      gridRow: segment.lane + 2,
                      zIndex: 1,
                    }}
                  />
                ))}

              {days.map((day, col) => {
                const hidden = segments.filter(
                  (s) => s.lane >= maxEventsPerDay && s.startCol <= col && col < s.startCol + s.span,
                ).length;
                if (hidden === 0) return null;
                return (
                  <Popover key={`more-${col}`}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground hover:bg-muted mx-1 rounded-md px-1.5 text-left text-xs font-medium"
                        style={{ gridColumn: col + 1, gridRow: maxEventsPerDay + 2, zIndex: 1 }}
                      >
                        +{hidden} more
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-64 p-2">
                      <p className="text-muted-foreground px-1 pb-2 text-xs font-medium">
                        {day.format("dddd, D MMMM")}
                      </p>
                      <div className="flex flex-col gap-1">
                        {eventsOn(day).map((occurrence) => (
                          <EventBar
                            key={occurrence.key}
                            occurrence={occurrence}
                            surface={null}
                            className="mx-0 h-7 rounded-md"
                          />
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
