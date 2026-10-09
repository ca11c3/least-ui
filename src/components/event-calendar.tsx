"use client";

import * as React from "react";
import dayjs, { type Dayjs } from "dayjs";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "../lib/utils";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  /** Inclusive end. Omit for an event on a single day. */
  end?: Date;
  /** All-day events show no time and sort before timed ones. */
  allDay?: boolean;
  /** Any CSS colour; defaults to the theme's primary. */
  color?: string;
  /** Draws the title struck through, e.g. for a finished task. */
  completed?: boolean;
};

export interface EventCalendarProps {
  events: CalendarEvent[];
  /** Any day in the month to show. Pass with `onMonthChange` to control it. */
  month?: Date;
  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onDayClick?: (day: Date) => void;
  /** Event rows per day before the rest collapse into "+N more". */
  maxEventsPerDay?: number;
  /** 0 starts weeks on Sunday, 1 on Monday. */
  weekStartsOn?: 0 | 1;
  /** Extra controls for the right of the header, such as a view switcher. */
  toolbar?: React.ReactNode;
  className?: string;
}

type Segment = {
  event: CalendarEvent;
  startCol: number;
  span: number;
  /** Whether the event starts/ends inside this week, for rounded ends. */
  isStart: boolean;
  isEnd: boolean;
  lane: number;
};

function eventEnd(event: CalendarEvent) {
  return dayjs(event.end ?? event.start);
}

function formatTime(date: Date) {
  const d = dayjs(date);
  return d.minute() === 0 ? d.format("ha") : d.format("h:mma");
}

function sortEvents(a: CalendarEvent, b: CalendarEvent) {
  const spanA = eventEnd(a).diff(a.start, "day");
  const spanB = eventEnd(b).diff(b.start, "day");
  return (
    dayjs(a.start).startOf("day").diff(dayjs(b.start).startOf("day")) ||
    spanB - spanA ||
    Number(!!b.allDay) - Number(!!a.allDay) ||
    a.start.getTime() - b.start.getTime()
  );
}

// Clips each event to the week and stacks overlapping ones into lanes, so a
// multi-day event is one bar instead of a chip per day.
function layoutWeek(weekStart: Dayjs, events: CalendarEvent[]): Segment[] {
  const weekEnd = weekStart.add(6, "day").endOf("day");
  const lanes: number[] = []; // last occupied column per lane
  return events
    .filter(
      (event) =>
        !dayjs(event.start).isAfter(weekEnd) &&
        !eventEnd(event).isBefore(weekStart),
    )
    .sort(sortEvents)
    .map((event) => {
      const start = dayjs(event.start).startOf("day");
      const end = eventEnd(event).startOf("day");
      const startCol = Math.max(start.diff(weekStart, "day"), 0);
      const endCol = Math.min(end.diff(weekStart, "day"), 6);
      let lane = lanes.findIndex((last) => last < startCol);
      if (lane === -1) lane = lanes.length;
      lanes[lane] = endCol;
      return {
        event,
        startCol,
        span: endCol - startCol + 1,
        isStart: !start.isBefore(weekStart),
        isEnd: !end.isAfter(weekEnd),
        lane,
      };
    });
}

function EventChip({
  event,
  isStart = true,
  isEnd = true,
  onClick,
  className,
  style,
}: {
  event: CalendarEvent;
  isStart?: boolean;
  isEnd?: boolean;
  onClick?: (event: CalendarEvent) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const color = event.color ?? "var(--color-primary)";
  const isSingleDay = eventEnd(event).isSame(event.start, "day");

  return (
    <button
      type="button"
      data-slot="event-calendar-event"
      title={event.title}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(event);
      }}
      style={{ "--event-color": color, ...style } as React.CSSProperties}
      className={cn(
        "pointer-events-auto flex h-full min-w-0 items-center gap-1 px-2 text-left text-xs leading-none font-medium transition-colors",
        "bg-[color-mix(in_srgb,var(--event-color)_18%,var(--color-card))] text-foreground hover:bg-[color-mix(in_srgb,var(--event-color)_28%,var(--color-card))]",
        "focus-visible:ring-ring/50 outline-none focus-visible:ring-2",
        isStart ? "ml-1 rounded-l-md" : "-ml-px border-l-0",
        isEnd ? "mr-1 rounded-r-md" : "-mr-px",
        className,
      )}
    >
      {!event.allDay && isSingleDay && (
        <span className="text-muted-foreground shrink-0 font-normal">
          {formatTime(event.start)}
        </span>
      )}
      <span className={cn("truncate", event.completed && "line-through opacity-70")}>
        {event.title}
      </span>
    </button>
  );
}

function EventCalendar({
  events,
  month,
  defaultMonth,
  onMonthChange,
  onEventClick,
  onDayClick,
  maxEventsPerDay = 3,
  weekStartsOn = 0,
  toolbar,
  className,
}: EventCalendarProps) {
  const [internalMonth, setInternalMonth] = React.useState(
    () => defaultMonth ?? new Date(),
  );
  const current = dayjs(month ?? internalMonth).startOf("month");

  const setMonth = (next: Dayjs) => {
    if (month === undefined) setInternalMonth(next.toDate());
    onMonthChange?.(next.toDate());
  };

  const gridStart = current.subtract((current.day() - weekStartsOn + 7) % 7, "day");
  const weekCount = Math.ceil((current.daysInMonth() + current.diff(gridStart, "day")) / 7);
  const weeks = Array.from({ length: weekCount }, (_, i) => gridStart.add(i, "week"));
  const weekdayNames = Array.from({ length: 7 }, (_, i) =>
    gridStart.add(i, "day").format("ddd"),
  );
  const today = dayjs();

  const eventsOn = (day: Dayjs) =>
    events
      .filter(
        (event) =>
          !dayjs(event.start).startOf("day").isAfter(day) &&
          !eventEnd(event).startOf("day").isBefore(day),
      )
      .sort(sortEvents);

  return (
    <div
      data-slot="event-calendar"
      className={cn("bg-card text-card-foreground flex flex-col overflow-hidden rounded-xl border", className)}
    >
      <div className="flex flex-wrap items-center gap-3 border-b px-3 py-3 sm:px-4">
        <Button variant="outline" size="sm" onClick={() => setMonth(dayjs().startOf("month"))}>
          <CalendarIcon />
          Today
        </Button>
        <div className="flex items-center gap-1 sm:mx-auto">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Previous month"
            onClick={() => setMonth(current.subtract(1, "month"))}
          >
            <ChevronLeftIcon />
          </Button>
          <h2 className="min-w-36 text-center text-lg font-semibold" aria-live="polite">
            {current.format("MMMM YYYY")}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Next month"
            onClick={() => setMonth(current.add(1, "month"))}
          >
            <ChevronRightIcon />
          </Button>
        </div>
        {toolbar ? <div className="ml-auto flex items-center gap-2 sm:ml-0">{toolbar}</div> : null}
      </div>

      <div className="text-muted-foreground grid grid-cols-7 border-b text-center text-xs font-medium">
        {weekdayNames.map((name) => (
          <div key={name} className="py-2">
            {name}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="min-w-[560px]">
          {weeks.map((weekStart) => {
            const segments = layoutWeek(weekStart, events);
            const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, "day"));

            return (
              <div
                key={weekStart.valueOf()}
                className="relative border-b last:border-b-0"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  gridTemplateRows: `2rem repeat(${maxEventsPerDay + 1}, 1.375rem)`,
                  rowGap: "0.25rem",
                  paddingBottom: "0.5rem",
                }}
              >
                {/* Day cells sit behind the events and take day clicks. */}
                {days.map((day, col) => (
                  <div
                    key={`bg-${col}`}
                    onClick={() => onDayClick?.(day.toDate())}
                    className={cn(
                      "border-r last:border-r-0",
                      !day.isSame(current, "month") && "bg-muted/40",
                      onDayClick && "hover:bg-muted/60 cursor-pointer",
                    )}
                    style={{ gridColumn: col + 1, gridRow: "1 / -1", marginBottom: "-0.5rem" }}
                  />
                ))}

                {days.map((day, col) => {
                  const isToday = day.isSame(today, "day");
                  return (
                    <div
                      key={`date-${col}`}
                      className="pointer-events-none px-2 pt-1.5"
                      style={{ gridColumn: col + 1, gridRow: 1 }}
                    >
                      <span
                        className={cn(
                          "inline-grid size-6 place-items-center rounded-full text-sm",
                          isToday
                            ? "bg-primary text-primary-foreground font-semibold"
                            : day.isSame(current, "month")
                              ? "text-foreground"
                              : "text-muted-foreground",
                        )}
                      >
                        {day.date()}
                      </span>
                    </div>
                  );
                })}

                {segments
                  .filter((segment) => segment.lane < maxEventsPerDay)
                  .map((segment) => (
                    <EventChip
                      key={segment.event.id}
                      event={segment.event}
                      isStart={segment.isStart}
                      isEnd={segment.isEnd}
                      onClick={onEventClick}
                      style={{
                        gridColumn: `${segment.startCol + 1} / span ${segment.span}`,
                        gridRow: segment.lane + 2,
                        zIndex: 1,
                      }}
                    />
                  ))}

                {days.map((day, col) => {
                  const hidden = segments.filter(
                    (s) =>
                      s.lane >= maxEventsPerDay &&
                      s.startCol <= col &&
                      col < s.startCol + s.span,
                  ).length;
                  if (hidden === 0) return null;
                  return (
                    <Popover key={`more-${col}`}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground mx-1 rounded-md px-1.5 text-left text-xs font-medium"
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
                          {eventsOn(day).map((event) => (
                            <EventChip
                              key={event.id}
                              event={event}
                              onClick={onEventClick}
                              className="mx-0 h-7"
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
    </div>
  );
}

export { EventCalendar };
