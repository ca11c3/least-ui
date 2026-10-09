import dayjs, { type Dayjs } from "dayjs";

import type { Occurrence, SchedulerEvent, SchedulerEventColor } from "./types";

export const MINUTE = 60_000;
export const DAY_MINUTES = 24 * 60;

const PALETTE: Record<string, string> = {
  primary: "var(--color-primary)",
  purple: "rgb(147 51 234)",
  teal: "rgb(13 148 136)",
  lime: "rgb(101 163 13)",
  orange: "rgb(234 88 12)",
  green: "rgb(22 163 74)",
  pink: "rgb(219 39 119)",
  indigo: "rgb(79 70 229)",
  amber: "rgb(217 119 6)",
  blue: "rgb(37 99 235)",
  red: "rgb(220 38 38)",
};

export const PALETTE_NAMES = Object.keys(PALETTE) as SchedulerEventColor[];

export function resolveColor(color: SchedulerEventColor | undefined) {
  if (!color) return PALETTE.primary;
  return PALETTE[color] ?? color;
}

// ---------------------------------------------------------------------------
// Event extents

/** The exclusive instant an event stops occupying the calendar. */
export function spanEnd(item: { start: Date; end: Date; allDay?: boolean }) {
  if (item.allDay) return dayjs(item.end).startOf("day").add(1, "day");
  return dayjs(Math.max(item.end.getTime(), item.start.getTime()));
}

export function firstDay(item: { start: Date }) {
  return dayjs(item.start).startOf("day");
}

/** The last calendar day the event touches, so a 9pm–midnight event stays on one day. */
export function lastDay(item: { start: Date; end: Date; allDay?: boolean }) {
  const end = spanEnd(item).subtract(1, "millisecond").startOf("day");
  const first = firstDay(item);
  return end.isBefore(first) ? first : end;
}

/**
 * Whether an occurrence belongs in the all-day row and draws as a filled bar.
 * Timed events shorter than a day stay in the time grid, even across midnight.
 */
export function isDayLevel(item: { start: Date; end: Date; allDay?: boolean }) {
  return !!item.allDay || item.end.getTime() - item.start.getTime() >= DAY_MINUTES * MINUTE;
}

export function overlaps(
  item: { start: Date; end: Date; allDay?: boolean },
  rangeStart: Dayjs,
  rangeEnd: Dayjs,
) {
  return dayjs(item.start).isBefore(rangeEnd) && spanEnd(item).isAfter(rangeStart);
}

export function formatTime(date: Date | Dayjs, ampm: boolean) {
  const d = dayjs(date);
  if (!ampm) return d.format("HH:mm");
  return d.minute() === 0 ? d.format("ha") : d.format("h:mma");
}

// ---------------------------------------------------------------------------
// Recurrence

type Freq = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
type ByDay = { weekday: number; nth?: number };

export type ParsedRule = {
  freq: Freq;
  interval: number;
  count?: number;
  until?: Dayjs;
  byDay?: ByDay[];
  byMonthDay?: number[];
};

const WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function parseUntil(value: string) {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(value);
  if (!m) return dayjs(value);
  const [, y, mo, d, h, mi, s, z] = m;
  if (h === undefined) return dayjs(new Date(+y, +mo - 1, +d)).endOf("day");
  return dayjs(z ? Date.UTC(+y, +mo - 1, +d, +h, +mi, +s) : new Date(+y, +mo - 1, +d, +h, +mi, +s));
}

export function parseRRule(rule: string): ParsedRule | null {
  const parts: Record<string, string> = {};
  for (const part of rule.replace(/^RRULE:/i, "").split(";")) {
    const [key, value = ""] = part.split("=");
    if (key) parts[key.trim().toUpperCase()] = value.trim();
  }
  const freq = parts.FREQ?.toUpperCase() as Freq;
  if (!["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(freq)) return null;

  return {
    freq,
    interval: Math.max(1, Number(parts.INTERVAL) || 1),
    count: parts.COUNT ? Number(parts.COUNT) : undefined,
    until: parts.UNTIL ? parseUntil(parts.UNTIL) : undefined,
    byDay: parts.BYDAY
      ? parts.BYDAY.split(",").flatMap((token) => {
          const m = /^([+-]?\d+)?([A-Z]{2})$/i.exec(token.trim());
          const weekday = m ? WEEKDAYS.indexOf(m[2].toUpperCase()) : -1;
          return weekday < 0 ? [] : [{ weekday, nth: m![1] ? Number(m![1]) : undefined }];
        })
      : undefined,
    byMonthDay: parts.BYMONTHDAY
      ? parts.BYMONTHDAY.split(",").map(Number).filter(Boolean)
      : undefined,
  };
}

function withTimeOf(day: Dayjs, time: Dayjs) {
  return day
    .hour(time.hour())
    .minute(time.minute())
    .second(time.second())
    .millisecond(time.millisecond());
}

function nthWeekdayOfMonth(month: Dayjs, weekday: number, nth: number) {
  if (nth > 0) {
    const first = month.startOf("month");
    const day = first.add((weekday - first.day() + 7) % 7, "day").add(nth - 1, "week");
    return day.isSame(month, "month") ? day : null;
  }
  const last = month.endOf("month").startOf("day");
  const day = last.subtract((last.day() - weekday + 7) % 7, "day").add(nth + 1, "week");
  return day.isSame(month, "month") ? day : null;
}

// Candidate start days for the k-th period of the rule, in order.
function periodDays(rule: ParsedRule, origin: Dayjs, k: number): Dayjs[] {
  const step = k * rule.interval;
  switch (rule.freq) {
    case "DAILY": {
      // BYDAY limits a daily rule, e.g. weekdays only.
      const day = origin.add(step, "day");
      return !rule.byDay?.length || rule.byDay.some((d) => d.weekday === day.day()) ? [day] : [];
    }
    case "WEEKLY": {
      const week = origin.startOf("week").add(step, "week");
      const days = rule.byDay?.length ? rule.byDay.map((d) => d.weekday) : [origin.day()];
      return [...new Set(days)].sort((a, b) => a - b).map((d) => week.add(d, "day"));
    }
    case "MONTHLY": {
      const month = origin.startOf("month").add(step, "month");
      let days: Dayjs[];
      if (rule.byMonthDay?.length) {
        days = rule.byMonthDay.map((md) =>
          md > 0 ? month.date(md) : month.endOf("month").startOf("day").add(md + 1, "day"),
        );
      } else if (rule.byDay?.length) {
        days = rule.byDay.flatMap((d) => {
          if (d.nth) return nthWeekdayOfMonth(month, d.weekday, d.nth) ?? [];
          // Every matching weekday in the month.
          const first = month.add((d.weekday - month.day() + 7) % 7, "day");
          return Array.from({ length: 5 }, (_, i) => first.add(i, "week"));
        });
      } else {
        days = [month.date(origin.date())];
      }
      return days
        .filter((day) => day.isSame(month, "month"))
        .sort((a, b) => a.valueOf() - b.valueOf());
    }
    case "YEARLY":
      return [origin.add(step, "year")];
  }
}

const MAX_ITERATIONS = 10_000;

/** Every occurrence of `event` that touches [rangeStart, rangeEnd). */
export function expandEvent(event: SchedulerEvent, rangeStart: Dayjs, rangeEnd: Dayjs): Occurrence[] {
  const rule = event.rrule ? parseRRule(event.rrule) : null;
  if (!rule) {
    return overlaps(event, rangeStart, rangeEnd)
      ? [{ key: event.id, event, start: event.start, end: event.end }]
      : [];
  }

  const origin = dayjs(event.start);
  const duration = event.end.getTime() - event.start.getTime();
  const result: Occurrence[] = [];
  let emitted = 0;

  for (let k = 0; k < MAX_ITERATIONS; k++) {
    for (const day of periodDays(rule, origin.startOf("day"), k)) {
      const start = withTimeOf(day, origin);
      if (start.isBefore(origin)) continue;
      if (start.isAfter(rangeEnd) || (rule.until && start.isAfter(rule.until))) return result;
      if (rule.count !== undefined && emitted >= rule.count) return result;
      emitted++;
      const occurrence = {
        key: `${event.id}::${start.valueOf()}`,
        event,
        start: start.toDate(),
        end: new Date(start.valueOf() + duration),
      };
      if (overlaps({ ...occurrence, allDay: event.allDay }, rangeStart, rangeEnd)) {
        result.push(occurrence);
      }
    }
  }
  return result;
}

export function sortOccurrences(a: Occurrence, b: Occurrence) {
  const spanA = lastDay({ ...a, allDay: a.event.allDay }).diff(firstDay(a), "day");
  const spanB = lastDay({ ...b, allDay: b.event.allDay }).diff(firstDay(b), "day");
  return (
    firstDay(a).diff(firstDay(b)) ||
    spanB - spanA ||
    Number(!!b.event.allDay) - Number(!!a.event.allDay) ||
    a.start.getTime() - b.start.getTime() ||
    a.event.title.localeCompare(b.event.title)
  );
}

// ---------------------------------------------------------------------------
// Layout

export type RowSegment = {
  occurrence: Occurrence;
  startCol: number;
  span: number;
  /** Whether the event starts/ends inside this row, for rounded ends. */
  isStart: boolean;
  isEnd: boolean;
  lane: number;
};

// Clips each occurrence to a row of `days` days and stacks overlapping ones
// into lanes, so a multi-day event is one bar instead of a chip per day.
export function layoutRow(rowStart: Dayjs, days: number, occurrences: Occurrence[]): RowSegment[] {
  const rowEnd = rowStart.add(days - 1, "day");
  const lanes: number[] = []; // last occupied column per lane
  return occurrences
    .filter((o) => {
      const item = { ...o, allDay: o.event.allDay };
      return !firstDay(item).isAfter(rowEnd) && !lastDay(item).isBefore(rowStart);
    })
    .sort(sortOccurrences)
    .map((occurrence) => {
      const item = { ...occurrence, allDay: occurrence.event.allDay };
      const start = firstDay(item);
      const end = lastDay(item);
      const startCol = Math.max(start.diff(rowStart, "day"), 0);
      const endCol = Math.min(end.diff(rowStart, "day"), days - 1);
      let lane = lanes.findIndex((last) => last < startCol);
      if (lane === -1) lane = lanes.length;
      lanes[lane] = endCol;
      return {
        occurrence,
        startCol,
        span: endCol - startCol + 1,
        isStart: !start.isBefore(rowStart),
        isEnd: !end.isAfter(rowEnd),
        lane,
      };
    });
}

export type TimedSegment = {
  occurrence: Occurrence;
  /** Minutes from midnight. */
  top: number;
  bottom: number;
  column: number;
  columns: number;
  /** Whether the event continues from the previous / into the next day. */
  clippedStart: boolean;
  clippedEnd: boolean;
};

const MIN_VISUAL_MINUTES = 20;

// Splits overlapping events into side-by-side columns. Events that overlap
// transitively share a cluster, and every event in a cluster has the same width.
export function layoutDay(day: Dayjs, occurrences: Occurrence[]): TimedSegment[] {
  const dayStart = day.startOf("day");
  const dayEnd = dayStart.add(1, "day");
  const items = occurrences
    .filter((o) => dayjs(o.start).isBefore(dayEnd) && dayjs(o.end).isAfter(dayStart))
    .map((occurrence) => {
      const top = Math.max(dayjs(occurrence.start).diff(dayStart, "minute"), 0);
      const bottom = Math.min(dayjs(occurrence.end).diff(dayStart, "minute"), DAY_MINUTES);
      return {
        occurrence,
        top,
        bottom,
        visualBottom: Math.min(Math.max(bottom, top + MIN_VISUAL_MINUTES), DAY_MINUTES),
        column: 0,
        columns: 1,
        clippedStart: dayjs(occurrence.start).isBefore(dayStart),
        clippedEnd: dayjs(occurrence.end).isAfter(dayEnd),
      };
    })
    .sort((a, b) => a.top - b.top || b.bottom - a.bottom);

  let cluster: typeof items = [];
  let columnEnds: number[] = [];
  let clusterEnd = -1;
  const flush = () => {
    for (const item of cluster) item.columns = columnEnds.length;
    cluster = [];
    columnEnds = [];
  };

  for (const item of items) {
    if (item.top >= clusterEnd) flush();
    let column = columnEnds.findIndex((end) => end <= item.top);
    if (column === -1) column = columnEnds.length;
    columnEnds[column] = item.visualBottom;
    item.column = column;
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.visualBottom);
  }
  flush();

  return items.map(({ visualBottom: _, ...segment }) => segment);
}
