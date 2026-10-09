import * as React from "react";
import dayjs, { type Dayjs } from "dayjs";

import { cn } from "../lib/utils";
import { COLUMN_ATTR, DAY_ATTR, dayKey, timeAtPoint, useScheduler } from "./context";
import { EventBar, EventBlock } from "./event-item";
import type { Occurrence } from "./types";
import { DAY_MINUTES, MINUTE, formatTime, isDayLevel, layoutDay, layoutRow } from "./utils";

const GUTTER = "3.5rem";
const SLOT_MINUTES = 30;

function useNow() {
  const [now, setNow] = React.useState(() => dayjs());
  React.useEffect(() => {
    const id = setInterval(() => setNow(dayjs()), MINUTE);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function TimeGridView({
  start,
  days: dayCount,
  occurrences,
  scrollToHour,
}: {
  start: Dayjs;
  days: number;
  occurrences: Occurrence[];
  scrollToHour: number;
}) {
  const { hourHeight, ampm, creation, createEvent, goToDay } = useScheduler();
  const now = useNow();
  const days = Array.from({ length: dayCount }, (_, i) => start.add(i, "day"));
  const columns = `${GUTTER} repeat(${dayCount}, minmax(0, 1fr))`;

  const dayLevel = occurrences.filter((o) => isDayLevel({ ...o, allDay: o.event.allDay }));
  const timed = occurrences.filter((o) => !isDayLevel({ ...o, allDay: o.event.allDay }));
  const allDaySegments = layoutRow(start, dayCount, dayLevel);
  const allDayLanes = Math.max(1, ...allDaySegments.map((s) => s.lane + 1));

  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    // A little above the hour, so its label isn't cut off.
    if (scrollRef.current) scrollRef.current.scrollTop = Math.max(scrollToHour * hourHeight - 12, 0);
    // Only on mount and view changes, so navigating keeps the user's scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayCount]);

  const createFromPointer = (e: React.MouseEvent) => {
    const at = timeAtPoint(e.clientX, e.clientY);
    if (at === null) return;
    const slot = SLOT_MINUTES * MINUTE;
    const startAt = dayjs(Math.floor(at / slot) * slot);
    createEvent(startAt.toDate(), startAt.add(creation!.duration, "minute").toDate(), false);
  };

  const createAllDay = (day: Dayjs) => createEvent(day.toDate(), day.toDate(), true);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-auto">
      <div className={cn("flex min-h-0 flex-1 flex-col", dayCount > 1 && "min-w-[640px]")}>
        {/* Day headers */}
        <div className="grid overflow-y-hidden border-b [scrollbar-gutter:stable]" style={{ gridTemplateColumns: columns }}>
          <div />
          {days.map((day) => {
            const isToday = day.isSame(now, "day");
            return (
              <button
                key={day.valueOf()}
                type="button"
                onClick={() => goToDay(day.toDate())}
                disabled={dayCount === 1}
                className="hover:bg-muted/60 focus-visible:ring-ring/50 flex flex-col items-center gap-0.5 py-2 outline-none focus-visible:ring-2 focus-visible:ring-inset disabled:pointer-events-none"
              >
                <span className={cn("text-xs font-medium", isToday ? "text-primary" : "text-muted-foreground")}>
                  {day.format("ddd")}
                </span>
                <span
                  className={cn(
                    "inline-grid size-8 place-items-center rounded-full text-lg leading-none",
                    isToday ? "bg-primary text-primary-foreground font-semibold" : "text-foreground",
                  )}
                >
                  {day.date()}
                </span>
              </button>
            );
          })}
        </div>

        {/* All-day row */}
        <div
          className="grid max-h-32 shrink-0 overflow-y-auto border-b [scrollbar-gutter:stable]"
          style={{ gridTemplateColumns: columns }}
        >
          <div className="text-muted-foreground flex items-start justify-end py-1.5 pr-2 text-[0.6875rem]">
            All day
          </div>
          <div
            className="relative grid py-1"
            style={{
              gridColumn: `2 / span ${dayCount}`,
              gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${allDayLanes}, 1.375rem)`,
              rowGap: "0.125rem",
            }}
          >
            {days.map((day, col) => (
              <div
                key={day.valueOf()}
                {...{ [DAY_ATTR]: dayKey(day) }}
                onClick={creation?.interaction === "click" ? () => createAllDay(day) : undefined}
                onDoubleClick={creation?.interaction === "double-click" ? () => createAllDay(day) : undefined}
                className="border-l"
                style={{ gridColumn: col + 1, gridRow: "1 / -1", margin: "-0.25rem 0" }}
              />
            ))}
            {allDaySegments.map((segment) => (
              <EventBar
                key={segment.occurrence.key}
                occurrence={segment.occurrence}
                isStart={segment.isStart}
                isEnd={segment.isEnd}
                style={{
                  gridColumn: `${segment.startCol + 1} / span ${segment.span}`,
                  gridRow: segment.lane + 1,
                  zIndex: 1,
                }}
              />
            ))}
          </div>
        </div>

        {/* Hours */}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
          <div className="relative grid" style={{ gridTemplateColumns: columns, height: 24 * hourHeight }}>
            <div className="relative">
              {Array.from({ length: 23 }, (_, i) => (
                <span
                  key={i}
                  className="text-muted-foreground absolute right-2 -translate-y-1/2 text-[0.6875rem] whitespace-nowrap"
                  style={{ top: (i + 1) * hourHeight }}
                >
                  {formatTime(dayjs().startOf("day").add(i + 1, "hour"), ampm)}
                </span>
              ))}
            </div>

            {/* Hour lines span every column. */}
            <div className="pointer-events-none absolute inset-0" style={{ left: GUTTER }}>
              {Array.from({ length: 24 }, (_, i) => (
                <div
                  key={i}
                  className="border-border/70 absolute inset-x-0 border-t"
                  style={{ top: i * hourHeight }}
                >
                  <div className="border-border/40 absolute inset-x-0 border-t border-dashed" style={{ top: hourHeight / 2 }} />
                </div>
              ))}
            </div>

            {days.map((day) => {
              const segments = layoutDay(day, timed);
              const isToday = day.isSame(now, "day");
              return (
                <div
                  key={day.valueOf()}
                  {...{ [COLUMN_ATTR]: dayKey(day) }}
                  onClick={creation?.interaction === "click" ? createFromPointer : undefined}
                  onDoubleClick={creation?.interaction === "double-click" ? createFromPointer : undefined}
                  className={cn("relative border-l", isToday && "bg-primary/[0.03]")}
                >
                  {segments.map((segment) => {
                    const width = 100 / segment.columns;
                    return (
                      <EventBlock
                        key={segment.occurrence.key}
                        occurrence={segment.occurrence}
                        clippedStart={segment.clippedStart}
                        clippedEnd={segment.clippedEnd}
                        style={{
                          top: `${(segment.top / DAY_MINUTES) * 100}%`,
                          height: `calc(${((segment.bottom - segment.top) / DAY_MINUTES) * 100}% - 1px)`,
                          left: `calc(${segment.column * width}% + 2px)`,
                          width: `calc(${width}% - 4px)`,
                        }}
                      />
                    );
                  })}
                  {isToday && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 z-30 border-t-2 border-red-500"
                      style={{ top: `${(now.diff(day, "minute") / DAY_MINUTES) * 100}%` }}
                    >
                      <span className="absolute -top-[5px] -left-[5px] size-2 rounded-full bg-red-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
